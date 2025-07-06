import Navbar from './components/Navbar';
import AccountList from './components/AccountList';

export default function App() {
  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto py-8">
        <h2 className="text-2xl font-bold mb-4">AWS Accounts</h2>
        <input
          type="text"
          placeholder="Filter accounts by name, ID, or email address"
          className="w-full mb-4 px-4 py-2 rounded bg-gray-800 border border-gray-600 text-white"
          disabled // 搜索功能保留占位
        />
        <AccountList />
      </div>
    </div>
  );
}
