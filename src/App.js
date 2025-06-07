import React, { useState, useRef, useEffect } from 'react';
import { Camera, CreditCard, User, Users, Lock, Unlock, DollarSign, ArrowUpDown, ArrowDownLeft, ArrowUpRight, Home, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const ATMSystem = () => {
  // Mock data
  const [accounts] = useState([
    { mataikhoan: 1, sodu: 1500000, makh: 1, mathe: '1234567890123456', locked: false },
    { mataikhoan: 2, sodu: 2500000, makh: 2, mathe: '9876543210987654', locked: false },
    { mataikhoan: 3, sodu: 500000, makh: 3, mathe: '1111222233334444', locked: true },
    { mataikhoan: 4, sodu: 5000000, makh: 4, mathe: '1111111111111111', locked: false }
  ]);
  
  const [customers] = useState([
    { makh: 1, tenkh: 'Thiên Tài', cmnd: '123456789', sodienthoai: '0901234567' },
    { makh: 2, tenkh: 'Đức Tín', cmnd: '987654321', sodienthoai: '0909876543' },
    { makh: 3, tenkh: 'Đình Ân', cmnd: '111222333', sodienthoai: '0911111111' },
    { makh: 4, tenkh: 'Trần Anh Vũ', cmnd: '1111111111', sodienthoai: '0398765432' }
  ]);

  const [transactions, setTransactions] = useState([]);

  // States
  const [currentView, setCurrentView] = useState('home'); // home, cardInput, faceAuth, transaction, withdraw, deposit, transfer, employeePanel
  const [cardNumber, setCardNumber] = useState('');
  const [currentAccount, setCurrentAccount] = useState(null);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [amount, setAmount] = useState('');
  const [transferCard, setTransferCard] = useState('');
  const [transferRecipient, setTransferRecipient] = useState(null);
  const [message, setMessage] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [accountsState, setAccountsState] = useState(accounts);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start camera for face authentication
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsVideoOn(true);
      }
    } catch (err) {
      setMessage('Không thể truy cập camera. Vui lòng cho phép truy cập camera.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setIsVideoOn(false);
    }
  };

  // Simulate face authentication (always returns true for demo)
  const authenticateFace = () => {
    stopCamera();
    setMessage('Xác thực khuôn mặt thành công!');
    setTimeout(() => {
      setCurrentView('transaction');
      setMessage('');
    }, 1500);
  };

  // Handle card input
  const handleCardInput = () => {
    const account = accountsState.find(acc => acc.mathe === cardNumber);
    if (!account) {
      setMessage('Số thẻ không tồn tại!');
      return;
    }
    if (account.locked) {
      setMessage('Thẻ này đã bị khóa. Vui lòng liên hệ nhân viên!');
      return;
    }
    
    const customer = customers.find(c => c.makh === account.makh);
    setCurrentAccount(account);
    setCurrentCustomer(customer);
    setMessage('');
    setCurrentView('faceAuth');
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  // Check transfer recipient when card number changes
  const handleTransferCardChange = (cardNum) => {
    setTransferCard(cardNum);
    if (cardNum.length === 16) {
      const recipientAccount = accountsState.find(acc => acc.mathe === cardNum);
      if (recipientAccount && !recipientAccount.locked && recipientAccount.mataikhoan !== currentAccount.mataikhoan) {
        const recipient = customers.find(c => c.makh === recipientAccount.makh);
        setTransferRecipient(recipient);
      } else {
        setTransferRecipient(null);
      }
    } else {
      setTransferRecipient(null);
    }
  };

  // Transaction functions
  const withdraw = () => {
    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      setMessage('Vui lòng nhập số tiền hợp lệ!');
      return;
    }
    if (withdrawAmount > currentAccount.sodu) {
      setMessage('Số dư không đủ!');
      return;
    }

    const newBalance = currentAccount.sodu - withdrawAmount;
    updateAccountBalance(currentAccount.mataikhoan, newBalance);
    
    const transaction = {
      id_gd: Date.now(),
      noidung: `Rút tiền`,
      so_tien: withdrawAmount,
      thoigian: new Date().toLocaleString('vi-VN'),
      tai_khoan_gui: currentAccount.mataikhoan,
      tai_khoan_nhan: null
    };
    
    setTransactions(prev => [...prev, transaction]);
    setMessage(`Rút tiền thành công! Số dư còn lại: ${newBalance.toLocaleString('vi-VN')} VNĐ`);
    setAmount('');
  };

  const deposit = () => {
    const depositAmount = parseFloat(amount);
    if (!depositAmount || depositAmount <= 0) {
      setMessage('Vui lòng nhập số tiền hợp lệ!');
      return;
    }

    const newBalance = currentAccount.sodu + depositAmount;
    updateAccountBalance(currentAccount.mataikhoan, newBalance);
    
    const transaction = {
      id_gd: Date.now(),
      noidung: `Nạp tiền`,
      so_tien: depositAmount,
      thoigian: new Date().toLocaleString('vi-VN'),
      tai_khoan_gui: null,
      tai_khoan_nhan: currentAccount.mataikhoan
    };
    
    setTransactions(prev => [...prev, transaction]);
    setMessage(`Nạp tiền thành công! Số dư hiện tại: ${newBalance.toLocaleString('vi-VN')} VNĐ`);
    setAmount('');
  };

  const transfer = () => {
    const transferAmount = parseFloat(amount);
    if (!transferAmount || transferAmount <= 0) {
      setMessage('Vui lòng nhập số tiền hợp lệ!');
      return;
    }
    if (transferAmount > currentAccount.sodu) {
      setMessage('Số dư không đủ!');
      return;
    }

    const recipientAccount = accountsState.find(acc => acc.mathe === transferCard);
    if (!recipientAccount) {
      setMessage('Số thẻ người nhận không tồn tại!');
      return;
    }
    if (recipientAccount.locked) {
      setMessage('Tài khoản người nhận đã bị khóa!');
      return;
    }
    if (recipientAccount.mataikhoan === currentAccount.mataikhoan) {
      setMessage('Không thể chuyển tiền cho chính mình!');
      return;
    }

    const newSenderBalance = currentAccount.sodu - transferAmount;
    const newRecipientBalance = recipientAccount.sodu + transferAmount;
    
    updateAccountBalance(currentAccount.mataikhoan, newSenderBalance);
    updateAccountBalance(recipientAccount.mataikhoan, newRecipientBalance);
    
    const recipientInfo = customers.find(c => c.makh === recipientAccount.makh);
    
    const transaction = {
      id_gd: Date.now(),
      noidung: `Chuyển tiền đến ${recipientInfo?.tenkh || 'N/A'}`,
      so_tien: transferAmount,
      thoigian: new Date().toLocaleString('vi-VN'),
      tai_khoan_gui: currentAccount.mataikhoan,
      tai_khoan_nhan: recipientAccount.mataikhoan
    };
    
    setTransactions(prev => [...prev, transaction]);
    setMessage(`Chuyển tiền thành công! Số dư còn lại: ${newSenderBalance.toLocaleString('vi-VN')} VNĐ`);
    setAmount('');
    setTransferCard('');
    setTransferRecipient(null);
  };

  const updateAccountBalance = (accountId, newBalance) => {
    setAccountsState(prev => prev.map(acc => 
      acc.mataikhoan === accountId ? { ...acc, sodu: newBalance } : acc
    ));
    
    if (currentAccount && currentAccount.mataikhoan === accountId) {
      setCurrentAccount(prev => ({ ...prev, sodu: newBalance }));
    }
  };

  // Employee functions
  const toggleCardLock = (cardNumber) => {
    setAccountsState(prev => prev.map(acc => 
      acc.mathe === cardNumber ? { ...acc, locked: !acc.locked } : acc
    ));
    setMessage(`Thẻ ${cardNumber} đã được ${accountsState.find(acc => acc.mathe === cardNumber)?.locked ? 'mở khóa' : 'khóa'}!`);
  };

  // Reset to home
  const goHome = () => {
    stopCamera();
    setCurrentView('home');
    setCardNumber('');
    setCurrentAccount(null);
    setCurrentCustomer(null);
    setAmount('');
    setTransferCard('');
    setTransferRecipient(null);
    setMessage('');
  };

  // Go back to transaction menu
  const goBackToTransaction = () => {
    setCurrentView('transaction');
    setAmount('');
    setTransferCard('');
    setTransferRecipient(null);
    setMessage('');
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <CreditCard className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Hệ thống ATM</h1>
          <p className="text-gray-600">Chọn loại tài khoản của bạn</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => setCurrentView('cardInput')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          >
            <User className="w-5 h-5" />
            <span>Khách hàng</span>
          </button>
          
          <button
            onClick={() => setCurrentView('employeePanel')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          >
            <Users className="w-5 h-5" />
            <span>Nhân viên</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderCardInput = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <button
          onClick={goHome}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <Home className="w-4 h-4" />
          <span>Về trang chủ</span>
        </button>
        
        <div className="text-center mb-8">
          <CreditCard className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Nhập thẻ ATM</h2>
          <p className="text-gray-600">Vui lòng nhập số thẻ của bạn</p>
        </div>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Số thẻ (16 số)"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength="16"
          />
          
          <button
            onClick={handleCardInput}
            disabled={cardNumber.length !== 16}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition duration-200"
          >
            Xác nhận
          </button>
          
          {message && (
            <div className={`p-3 rounded-lg text-center ${message.includes('thành công') || message.includes('Xác thực') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 font-semibold mb-2">Thẻ demo:</p>
          <p className="text-xs text-gray-500">• 1234567890123456 (1,500,000 VNĐ)</p>
          <p className="text-xs text-gray-500">• 9876543210987654 (2,500,000 VNĐ)</p>
          <p className="text-xs text-red-500">• 1111222233334444 (Đã khóa)</p>
        </div>
      </div>
    </div>
  );

  const renderFaceAuth = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <button
          onClick={goHome}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <Home className="w-4 h-4" />
          <span>Về trang chủ</span>
        </button>
        
        <div className="text-center mb-8">
          <Camera className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác thực khuôn mặt</h2>
          <p className="text-gray-600">Vui lòng nhìn vào camera</p>
        </div>
        
        <div className="space-y-4">
          <div className="relative bg-gray-200 rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <button
            onClick={authenticateFace}
            disabled={!isVideoOn}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition duration-200"
          >
            Xác thực
          </button>
          
          {message && (
            <div className={`p-3 rounded-lg text-center ${message.includes('thành công') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTransaction = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Menu giao dịch</h2>
            <button
              onClick={goHome}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <Home className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
          
          {currentAccount && currentCustomer && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold text-blue-800">
                    Xin chào, {currentCustomer.tenkh}
                  </p>
                  <p className="text-sm text-blue-600">
                    Thẻ: {currentAccount.mathe}
                  </p>
                  <p className="text-sm text-blue-600">
                    SĐT: {currentCustomer.sodienthoai}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-800">
                    {currentAccount.sodu.toLocaleString('vi-VN')} VNĐ
                  </p>
                  <p className="text-sm text-blue-600">Số dư hiện tại</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid md:grid-cols-3 gap-6">
            <button
              onClick={() => setCurrentView('withdraw')}
              className="bg-red-50 hover:bg-red-100 p-6 rounded-lg transition duration-200 text-left"
            >
              <div className="flex items-center space-x-3 mb-3">
                <ArrowDownLeft className="w-8 h-8 text-red-600" />
                <h3 className="text-xl font-semibold text-red-800">Rút tiền</h3>
              </div>
              <p className="text-red-600">Rút tiền từ tài khoản</p>
            </button>
            
            <button
              onClick={() => setCurrentView('deposit')}
              className="bg-green-50 hover:bg-green-100 p-6 rounded-lg transition duration-200 text-left"
            >
              <div className="flex items-center space-x-3 mb-3">
                <ArrowUpRight className="w-8 h-8 text-green-600" />
                <h3 className="text-xl font-semibold text-green-800">Nạp tiền</h3>
              </div>
              <p className="text-green-600">Nạp tiền vào tài khoản</p>
            </button>
            
            <button
              onClick={() => setCurrentView('transfer')}
              className="bg-blue-50 hover:bg-blue-100 p-6 rounded-lg transition duration-200 text-left"
            >
              <div className="flex items-center space-x-3 mb-3">
                <ArrowUpDown className="w-8 h-8 text-blue-600" />
                <h3 className="text-xl font-semibold text-blue-800">Chuyển tiền</h3>
              </div>
              <p className="text-blue-600">Chuyển tiền cho người khác</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWithdraw = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-pink-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goBackToTransaction}
              className="text-red-600 hover:text-red-800 flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
            <h2 className="text-2xl font-bold text-gray-800">Rút tiền</h2>
            <button
              onClick={goHome}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <Home className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
          
          {currentAccount && currentCustomer && (
            <div className="bg-red-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold text-red-800">
                    {currentCustomer.tenkh}
                  </p>
                  <p className="text-sm text-red-600">
                    Thẻ: {currentAccount.mathe}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-red-800">
                    {currentAccount.sodu.toLocaleString('vi-VN')} VNĐ
                  </p>
                  <p className="text-sm text-red-600">Số dư hiện tại</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số tiền cần rút
              </label>
              <input
                type="number"
                placeholder="Nhập số tiền"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[100000, 200000, 500000, 1000000, 2000000, 5000000].map(preset => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset.toString())}
                  className="bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-3 px-4 rounded-lg transition duration-200"
                >
                  {preset.toLocaleString('vi-VN')}
                </button>
              ))}
            </div>
            
            <button
              onClick={withdraw}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 text-lg"
            >
              Xác nhận rút tiền
            </button>
            
            {message && (
              <div className={`p-4 rounded-lg text-center ${message.includes('thành công') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeposit = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-teal-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goBackToTransaction}
              className="text-green-600 hover:text-green-800 flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
            <h2 className="text-2xl font-bold text-gray-800">Nạp tiền</h2>
            <button
              onClick={goHome}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <Home className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
          
          {currentAccount && currentCustomer && (
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold text-green-800">
                    {currentCustomer.tenkh}
                  </p>
                  <p className="text-sm text-green-600">
                    Thẻ: {currentAccount.mathe}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-800">
                    {currentAccount.sodu.toLocaleString('vi-VN')} VNĐ
                  </p>
                  <p className="text-sm text-green-600">Số dư hiện tại</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số tiền cần nạp
              </label>
              <input
                type="number"
                placeholder="Nhập số tiền"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[100000, 200000, 500000, 1000000, 2000000, 5000000].map(preset => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset.toString())}
                  className="bg-green-100 hover:bg-green-200 text-green-800 font-semibold py-3 px-4 rounded-lg transition duration-200"
                >
                  {preset.toLocaleString('vi-VN')}
                </button>
              ))}
            </div>
            
            <button
              onClick={deposit}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 text-lg"
            >
              Xác nhận nạp tiền
            </button>
            
            {message && (
              <div className={`p-4 rounded-lg text-center ${message.includes('thành công') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTransfer = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goBackToTransaction}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
            <h2 className="text-2xl font-bold text-gray-800">Chuyển tiền</h2>
            <button
              onClick={goHome}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <Home className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
          
          {currentAccount && currentCustomer && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold text-blue-800">
                    {currentCustomer.tenkh}
                  </p>
                  <p className="text-sm text-blue-600">
                    Thẻ: {currentAccount.mathe}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-800">
                    {currentAccount.sodu.toLocaleString('vi-VN')} VNĐ
                  </p>
                  <p className="text-sm text-blue-600">Số dư hiện tại</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số thẻ người nhận
              </label>
              <input
                type="text"
                placeholder="Nhập số thẻ (16 số)"
                value={transferCard}
                onChange={(e) => handleTransferCardChange(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                maxLength="16"
              />
              
              {transferRecipient && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-green-800 font-semibold">Người nhận: {transferRecipient.tenkh}</p>
                      <p className="text-green-600 text-sm">SĐT: {transferRecipient.sodienthoai}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {transferCard.length === 16 && !transferRecipient && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800">Số thẻ không hợp lệ hoặc không thể chuyển tiền</p>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số tiền cần chuyển
              </label>
              <input
                type="number"
                placeholder="Nhập số tiền"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                disabled={!transferRecipient}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[100000, 200000, 500000, 1000000, 2000000, 5000000].map(preset => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset.toString())}
                  disabled={!transferRecipient}
                  className="bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-800 font-semibold py-3 px-4 rounded-lg transition duration-200"
                >
                  {preset.toLocaleString('vi-VN')}
                </button>
              ))}
            </div>
            
            <button
              onClick={transfer}
              disabled={!amount || parseFloat(amount) <= 0 || !transferRecipient}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 text-lg"
            >
              Xác nhận chuyển tiền
            </button>
            
            {message && (
              <div className={`p-4 rounded-lg text-center ${message.includes('thành công') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmployeePanel = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-blue-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Bảng điều khiển nhân viên</h2>
            <button
              onClick={goHome}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <Home className="w-4 h-4" />
              <span>Về trang chủ</span>
            </button>
          </div>
          
          <div className="grid gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quản lý thẻ</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="text-left p-3">Số thẻ</th>
                      <th className="text-left p-3">Khách hàng</th>
                      <th className="text-left p-3">Số dư</th>
                      <th className="text-left p-3">Trạng thái</th>
                      <th className="text-left p-3">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountsState.map(account => {
                      const customer = customers.find(c => c.makh === account.makh);
                      return (
                        <tr key={account.mataikhoan} className="border-b">
                          <td className="p-3 font-mono">{account.mathe}</td>
                          <td className="p-3">{customer?.tenkh || 'N/A'}</td>
                          <td className="p-3">{account.sodu.toLocaleString('vi-VN')} VNĐ</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${account.locked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {account.locked ? 'Đã khóa' : 'Hoạt động'}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => toggleCardLock(account.mathe)}
                              className={`flex items-center space-x-1 px-3 py-1 rounded text-sm ${account.locked ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                            >
                              {account.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              <span>{account.locked ? 'Mở khóa' : 'Khóa thẻ'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {transactions.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Lịch sử giao dịch</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="text-left p-3">Thời gian</th>
                        <th className="text-left p-3">Nội dung</th>
                        <th className="text-left p-3">Số tiền</th>
                        <th className="text-left p-3">Tài khoản gửi</th>
                        <th className="text-left p-3">Tài khoản nhận</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(-10).reverse().map(transaction => (
                        <tr key={transaction.id_gd} className="border-b">
                          <td className="p-3">{transaction.thoigian}</td>
                          <td className="p-3">{transaction.noidung}</td>
                          <td className="p-3 font-semibold">{transaction.so_tien.toLocaleString('vi-VN')} VNĐ</td>
                          <td className="p-3">{transaction.tai_khoan_gui || '-'}</td>
                          <td className="p-3">{transaction.tai_khoan_nhan || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {message && (
            <div className={`mt-6 p-4 rounded-lg text-center ${message.includes('thành công') || message.includes('mở khóa') || message.includes('khóa') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render based on current view
  switch (currentView) {
    case 'cardInput':
      return renderCardInput();
    case 'faceAuth':
      return renderFaceAuth();
    case 'transaction':
      return renderTransaction();
    case 'withdraw':
      return renderWithdraw();
    case 'deposit':
      return renderDeposit();
    case 'transfer':
      return renderTransfer();
    case 'employeePanel':
      return renderEmployeePanel();
    default:
      return renderHome();
  }
};

export default ATMSystem;