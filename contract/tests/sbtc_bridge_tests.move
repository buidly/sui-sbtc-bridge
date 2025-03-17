#[test_only]
module sbtc_bridge::sbtc_bridge_tests;

const ITS_HUB_CHAIN_NAME: vector<u8> = b"axelar";

/// ITS hub test address
const ITS_HUB_ADDRESS: vector<u8> = b"hub_address";

use sbtc_bridge::sbtc_bridge::{Singleton, OwnerCap, init_for_testing, receive_interchain_transfer, get_channel};
use sui::coin::Coin;
use sui::test_scenario;
use sui::test_utils::assert_eq;
use std::ascii;
use sui::sui::SUI;
use sui::address;
use sui::clock::{Self, Clock};
use interchain_token_service::{
    coin_info,
    coin_management,
    interchain_token_service_v0,
    interchain_token_service,
    token_id::TokenId
};
use axelar_gateway::bytes32;
use axelar_gateway::weighted_signers;
use axelar_gateway::gateway;

#[test]
fun test_module_init() {
    let owner = @0xAD;

    let mut scenario = test_scenario::begin(owner);
    {
        init_for_testing(scenario.ctx());
    };

    scenario.next_tx(owner);
    {
        let mut singleton_id = test_scenario::most_recent_id_shared<Singleton>();
        assert!(singleton_id.is_some(), 1);

        let singleton: Singleton = scenario.take_shared_by_id(singleton_id.extract());

        test_scenario::return_shared(singleton);

        let owner = scenario.take_from_sender<OwnerCap>();
        scenario.return_to_sender(owner);
    };
    scenario.end();
}

// Most of the code from https://github.com/axelarnetwork/axelar-cgp-sui/blob/main/move/interchain_token_service/sources/interchain_token_service.move#L615
#[test]
fun test_receive_interchain_transfer() {
    let owner = @0xAD;
    let user_address = @0xBD;

    let mut scenario = test_scenario::begin(owner);
    {
        init_for_testing(scenario.ctx());
    };

    let mut rng = sui::random::new_generator_for_testing();
    let operator = sui::address::from_bytes(rng.generate_bytes(32));
    let domain_separator = bytes32::from_bytes(rng.generate_bytes(32));
    let minimum_rotation_delay = rng.generate_u64();
    let previous_signers_retention = rng.generate_u64();
    let initial_signers = weighted_signers::dummy();
    let clock = clock::create_for_testing(scenario.ctx());

    let gateway = gateway::create_for_testing(
        operator,
        domain_separator,
        minimum_rotation_delay,
        previous_signers_retention,
        initial_signers,
        &clock,
        scenario.ctx(),
    );

    let mut its = interchain_token_service::create_for_testing(scenario.ctx());
    let destination_chain = ascii::string(b"Chain Name"); // from its::create_for_testing

    let coin_info = coin_info::from_info<SUI>(
        std::string::utf8(b"Name"),
        std::ascii::string(b"Symbol"),
        10,
    );

    let coin_management = coin_management::new_locked<SUI>();

    let token_id: TokenId = its.register_coin<SUI>(
        coin_info,
        coin_management,
    );

    scenario.next_tx(owner);
    {
        let mut singleton: Singleton = scenario.take_shared<Singleton>();
        let owner = scenario.take_from_sender<OwnerCap>();

        let coin = sui::coin::mint_for_testing<SUI>(100, scenario.ctx());

        let interchain_transfer_ticket = interchain_token_service::prepare_interchain_transfer(
            token_id,
            coin,
            destination_chain,
            b"Destination Address",
            b"",
            singleton.get_channel(),
        );
        sui::test_utils::destroy(its.send_interchain_transfer(
            interchain_transfer_ticket,
            &clock,
        ));

        let source_chain = ascii::string(b"Chain Name");
        let message_id = ascii::string(b"Message Id");
        let its_source_address = b"Source Address";

        let destination_address = singleton.get_channel().to_address();

        let user = address::to_bytes(user_address);
        let mut data: vector<u8> = vector[];
        // TODO: Add more data in the future
        let mut i = 0;
        while (i < 32) {
            data.push_back(user[i]);
            i = i + 1;
        };

        let mut writer = abi::abi::new_writer(6);
        writer
            .write_u256(0)
            .write_u256(token_id.to_u256())
            .write_bytes(its_source_address)
            .write_bytes(destination_address.to_bytes())
            .write_u256((100 as u256))
            .write_bytes(data);
        let mut payload = writer.into_bytes();
        payload = interchain_token_service_v0::wrap_payload_receiving(payload, source_chain);

        let approved_message = axelar_gateway::channel::new_approved_message(
            ITS_HUB_CHAIN_NAME.to_ascii_string(),
            message_id,
            ITS_HUB_ADDRESS.to_ascii_string(),
            its.channel_address(),
            payload,
        );

        receive_interchain_transfer<SUI>(
            approved_message,
            &mut singleton,
            &mut its,
            &clock,
            scenario.ctx()
        );

        test_scenario::return_shared(singleton);
        scenario.return_to_sender(owner);
    };

    // User got initial coin
    scenario.next_tx(user_address);
    {
        let coin = scenario.take_from_sender<Coin<SUI>>();

        assert_eq(coin.value(), 100);

        scenario.return_to_sender(coin);
    };

    clock.destroy_for_testing();
    sui::test_utils::destroy(gateway);
    sui::test_utils::destroy(its);

    scenario.end();
}
