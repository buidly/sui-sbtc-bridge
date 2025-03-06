import './App.css';
import Navbar from './components/Navbar';
import StacksConnect from './components/StacksConnect';
import SuiConnect from './components/SuiConnect';
import BitcoinConnect from '@/components/BitcoinConnect';

function App() {
  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <Navbar />
      <div className='container mx-auto p-4'>
        <h1 className='text-3xl font-bold mb-6 text-slate-900 dark:text-slate-50'>Multi-Chain dApp Starter</h1>

        <div className='grid md:grid-cols-3 gap-6'>
          <div>
            <BitcoinConnect />
          </div>
          <div>
            <StacksConnect />
          </div>
          <div>
            <SuiConnect />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;