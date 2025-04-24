module sbtc_bridge::sbtc_bridge;

use axelar_gateway::channel::{Self, Channel, ApprovedMessage};
use axelar_gateway::gateway::{Self, Gateway};
use axelar_gateway::message_ticket::MessageTicket;
use gas_service::gas_service::GasService;
use interchain_token_service::{
    discovery as its_discovery,
    interchain_token_service::{Self, InterchainTokenService},
    token_id::TokenId
};
use relayer_discovery::{discovery::RelayerDiscovery, transaction::{Self, Transaction}};
use std::{ascii::{Self, String}, type_name};
use sui::sui::SUI;
use sui::coin::Coin;
use sui::clock::Clock;
use sui::address;
use sui::hex;
use sbtc_bridge::utils::concat;

const VERSION: u64 = 1;

/// -----
/// Error
/// -----

const ENotUpgrade: u64 = 0;
const EWrongVersion: u64 = 1;

/// -----
/// Structs
/// -----
public struct Singleton has key {
    id: UID,
    channel: Channel,

    version: u64,
}

public fun get_channel(self: &Singleton): &Channel {
    &self.channel
}

public struct OwnerCap has key, store {
    id: UID,
}

/// -----
/// Events
/// -----

/// -----
/// Setup
/// -----
fun init(ctx: &mut TxContext) {
    let singletonId = object::new(ctx);
    let channel = channel::new(ctx);

    transfer::share_object(Singleton {
        id: singletonId,
        channel,
        version: VERSION,
    });

    let owner = OwnerCap {
        id: object::new(ctx),
    };

    transfer::public_transfer(owner, ctx.sender());
}

entry fun migrate(singleton: &mut Singleton, _owner: &OwnerCap) {
    assert!(singleton.version < VERSION, ENotUpgrade);
    singleton.version = VERSION;
}

// -----
// Public Functions
// -----

// TODO: Change Sui to STX token and send cross chain to Stacks?
public fun fund_stacks<T>(
    singleton: &mut Singleton,
    its: &mut InterchainTokenService,
    gateway: &mut Gateway,
    gas_service: &mut GasService,
    coin: Coin<T>,
    token_id: TokenId,
    destination_chain: String,
    destination_address: vector<u8>,
    gas: Coin<SUI>,
    clock: &Clock, // instance available at address 0x6
    ctx: &mut TxContext,
) {
    assert!(singleton.version == VERSION, EWrongVersion);

    let user = ctx.sender();

    let interchain_transfer_ticket = interchain_token_service::prepare_interchain_transfer<T>(
        token_id,
        coin,
        destination_chain,
        destination_address,
        vector[],
        &singleton.channel,
    );

    let message_ticket = its.send_interchain_transfer<T>(
        interchain_transfer_ticket,
        clock,
    );

    pay_gas_and_send_message(
        gateway,
        gas_service,
        gas,
        message_ticket,
        user,
        vector[],
    );
}

// -----
// ITS specific Functions from https://github.com/axelarnetwork/axelar-cgp-sui/blob/main/move/example/sources/its/its.move#L44
// -----

/// This needs to be called to register the transaction so that the relayer
/// knows to call this to fulfill calls.
public fun register_transaction(
    discovery: &mut RelayerDiscovery,
    singleton: &Singleton,
    its: &InterchainTokenService,
    clock: &Clock,
) {
    assert!(singleton.version == VERSION, EWrongVersion);

    let arguments = vector[
        concat(vector[0u8], object::id_address(singleton).to_bytes()),
        concat(vector[0u8], object::id_address(its).to_bytes()),
        vector[3u8],
        concat(vector[0u8], object::id_address(clock).to_bytes()),
    ];

    let transaction = transaction::new_transaction(
        false,
        vector[
            transaction::new_move_call(
                transaction::new_function(
                    address::from_bytes(
                        hex::decode(
                            *ascii::as_bytes(
                                &type_name::get_address(
                                    &type_name::get<Singleton>(),
                                ),
                            ),
                        ),
                    ),
                    ascii::string(b"its"),
                    ascii::string(b"get_final_transaction"),
                ),
                arguments,
                vector[],
            ),
        ],
    );

    discovery.register_transaction(&singleton.channel, transaction);
}

public fun get_final_transaction(
    singleton: &Singleton,
    its: &InterchainTokenService,
    payload: vector<u8>,
    clock: &Clock,
): Transaction {
    assert!(singleton.version == VERSION, EWrongVersion);

    let arguments = vector[
        vector[2u8],
        concat(vector[0u8], object::id_address(singleton).to_bytes()),
        concat(vector[0u8], object::id_address(its).to_bytes()),
        concat(vector[0u8], object::id_address(clock).to_bytes()),
    ];

    // Get the coin type from its
    let (token_id, _, _, _) = its_discovery::interchain_transfer_info(
        payload,
    );
    let coin_type = (*its.registered_coin_type(token_id)).into_string();

    let transaction = transaction::new_transaction(
        true,
        vector[
            transaction::new_move_call(
                transaction::new_function(
                    address::from_bytes(
                        hex::decode(
                            *ascii::as_bytes(
                                &type_name::get_address(
                                    &type_name::get<Singleton>(),
                                ),
                            ),
                        ),
                    ),
                    ascii::string(b"its"),
                    ascii::string(b"receive_interchain_transfer"),
                ),
                arguments,
                vector[coin_type],
            ),
        ],
    );

    transaction
}

/// This should receive some coins, give them to the executor, and emit and
/// event with all the relevant info.
#[allow(lint(self_transfer))]
public fun receive_interchain_transfer<T>(
    approved_message: ApprovedMessage,
    singleton: &mut Singleton,
    its: &mut InterchainTokenService,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(singleton.version == VERSION, EWrongVersion);

    let (
        _source_chain,
        _source_address,
        data,
        coin,
    ) = its.receive_interchain_transfer_with_data<T>(
        approved_message,
        &singleton.channel,
        clock,
        ctx,
    );

    let mut i = 0;
    let mut user = vector[];
    while (i < 32) {
        user.push_back(data[i]);
        i = i + 1;
    };
    // TODO: Are more arguments in `data`

    let user = address::from_bytes(user);

    // TODO: Dummy code, update with functionality

    transfer::public_transfer(coin, user);
}

// -----
// Private Functions
// -----

fun pay_gas_and_send_message(
    gateway: &Gateway,
    gas_service: &mut GasService,
    gas: Coin<SUI>,
    message_ticket: MessageTicket,
    refund_address: address,
    gas_params: vector<u8>,
) {
    gas_service.pay_gas(
        &message_ticket,
        gas,
        refund_address,
        gas_params,
    );

    gateway::send_message(gateway, message_ticket);
}

// -----
// Tests
// -----

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}