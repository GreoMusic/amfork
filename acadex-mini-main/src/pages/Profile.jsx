import { useCallback, useEffect, useState } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import CoverOne from '../images/cover/cover-01.png';
import userSix from '../images/user/user-06.png';
import MainLayout from '../layout/MainLayout';
import { fetchSubscription, getUser, useAuth, getMySubscription } from "../provider/authProvider";
import ImageUpload from './components/ImageUpload';
import moment from 'moment';
import { getReuest, packages, postReuest } from "../services/apiService";
import ToastAlert from './components/ToastAlert';
import ConfirmModal from './components/confirmModal';
import ChangePassword from './Authentication/ChangePassword';
import { Link } from 'react-router-dom';

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const Profile = () => {
  const user = getUser().user;
  const about = getUser().about;
  const { token } = useAuth();
  const [userPackage, setUserPackage] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [myUsages, setMyUsages] = useState(null);
  const [isPackageExpired, setIsPackageExpired] = useState(false);
  const [payments, setPayments] = useState([]);
  const [refundReason, setRefundReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [totalUsages, setTotalUsages] = useState(null);

  const fetchMyUsage = useCallback(() => {
    getReuest(`my-usage`, token).then(res => {
      setMyUsages(res.usages)

      console.log('usages', res.usages);
      const totalUploads = res.usages.reduce((acc, item) => acc + item.upload_count, 0);
      const totalEvaluations = res.usages.reduce((acc, item) => acc + item.evaluation_count, 0);
      setTotalUsages({upload_count: totalUploads, evaluation_count: totalEvaluations})
    });
  }, [token]);

  const checkSubscription = useCallback(() => {
    if (userPackage) {
      setIsProcessing(true);
      postReuest({ subscription_id: userPackage.stripe_subscription_id, }, `check-stripe-subscription`, token).then(res => {
        // setProfile(res.user);
        // console.log('check-subscription', res);
        setIsProcessing(false);
      }).catch(err => {
        // console.log('err', err);
        setIsProcessing(false);
      });
    }
  }, [userPackage, token]);

  const updateSubscription = () => {
    fetchSubscription().then(res => {
      setUserPackage(res);
    })
  }

  const fetchMyPayments = () => {
    getReuest(`my-payments`, token).then(res => {
      setPayments(res.payments);
    });
  }

  useEffect(() => {
    // My subscription
    updateSubscription();
    fetchMyUsage();
    fetchMyPayments();

  }, []);

  useEffect(() => {
    console.log('userPackage', userPackage)
    if (userPackage) {
      if (userPackage?.stripe_status !== 'active') {
        setIsPackageExpired(true);
      }
      const selPackage = packages.find(item => item.title === userPackage.type);
      setSelectedPackage(selPackage);
    }
  }, [userPackage, payments]);

  const handleClickRefund = (payment_id) => {

    let reason = prompt("Please enter your reason", "");

    if (reason != null) {
      setRefundReason(reason)
    }
    const postData = { payment_id, user_id: user.id, refund_reason: reason, subscription_id: userPackage.stripe_subscription_id };
    // console.log(postData);
    // return
    postReuest(postData, `cancel-stripe-subscription`, token).then(res => {
      // console.log('refund', res);
      if (res.error) {
        ToastAlert('Error Subscription cancellation!', res.error, "2");

      } else {
        ToastAlert('Subscription cancellation Success!', "This might take a few days and amount will be refunded after stripe charges!", "0")
      }
      updateSubscription();
      fetchMyPayments();
    });

    // console.log('payment_id', payment_id);

  }

  const confirmAction = () => {
    setConfirmModalOpen(false);
    setShowModal(false);
    handleClickRefund(payments[0].payment_id);
  }

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
    }
  };

  return (
    <MainLayout>
      {/* START */}

      <div className="min-h-screen bg-gradient-to-r from-blue-300 to-purple-700 pb-4">
      <div className="container mx-auto px-6 pb-6 text-black">
      <Breadcrumb pageName="My Profile" />
        <div className=" dark:bg-graydark shadow-2xl rounded-3xl overflow-hidden flex flex-col lg:flex-row">
          {/* Left Side - Profile */}
          <div className="bg-gradient-to-b from-purple-500 to-indigo-600 text-white p-8 lg:w-1/3 flex flex-col items-center">
            <div className='max-h-auto'>
            <ImageUpload />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-black">
              {user.first_name} {user.last_name}
            </h1>
            <h2 className="text-lg font-medium mb-6 text-black">{about}</h2>

            <div className="bg-white text-black text-center py-2 px-4 rounded-full font-semibold">
              Subscribed to: <span className="text-purple-700">{userPackage?.type}</span>
            </div>
          </div>

          {/* Right Side - Details */}
          <div className="flex-grow p-8 lg:p-16">
            {/* Account Information */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800">Account Information</h3>
              <button onClick={() => setShowChangePasswordModal(prev => !prev)} className="bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-purple-700 transition">
                Change Password
              </button>
            </div>

            <div className="mt-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Monthly Usage</h3>
              <div className="bg-[#f2f1ec]  dark:bg-[#0f0a32] p-6 rounded-2xl shadow-lg">
                {myUsages?.map((item, idx) => (
                  <p className="text-left text-gray-800 font-medium mb-2" key={idx}>
                    - {months[item.month]} {item.year}: <br/>&emsp;Uploads {item.upload_count}, Evaluations {item.evaluation_count}
                  </p>
                ))}
                {myUsages?.length === 0 ? (
                  <p className="text-center text-gray-500 font-medium">
                    No usage yet!
                  </p>
                ) : null}
              </div>
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {/* Uploaded Files */}
              <div className="bg-[#f2f1ec]  dark:bg-[#0f0a32] p-6 rounded-2xl shadow-lg">
                <h4 className="text-gray-700 text-lg font-semibold mb-2">Uploaded Files</h4>
                <p className="text-4xl font-bold text-purple-700">{totalUsages?.upload_count}</p>
              </div>

              {/* Evaluations Done */}
              <div className="bg-[#f2f1ec]  dark:bg-[#0f0a32] p-6 rounded-2xl shadow-lg">
                <h4 className="text-gray-700 text-lg font-semibold mb-2">Evaluations Completed</h4>
                <p className="text-4xl font-bold text-purple-700">{totalUsages?.evaluation_count}</p>
              </div>

              {/* Active Subscription */}
              <div className="bg-[#f2f1ec]  dark:bg-[#0f0a32] p-6 rounded-2xl shadow-lg">
                <h4 className="text-gray-700 text-lg font-semibold mb-2">Active Package</h4>
                <p className="text-xl font-semibold text-purple-700">{userPackage?.type} {isPackageExpired ? `Package canceled at ${moment(userPackage?.updated_at).format("MMM Do, YYYY")} ` : null}</p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Package Features</h3>
              <div className="bg-[#f2f1ec]  dark:bg-[#0f0a32] p-6 rounded-2xl shadow-lg">
                {selectedPackage?.features?.map((feature, idx) => (
                  <p className="text-left text-gray-800 font-medium mb-2" key={idx}>
                    - {feature}
                  </p>
                ))}
                {selectedPackage?.features?.length === 0 ? (
                  <p className="text-center text-gray-500 font-medium">
                    No features available.
                  </p>
                ) : null}
              </div>
            </div>

            {/* User Actions */}
            <div className="mt-8 flex flex-wrap">
              <button onClick={() => setShowModal(prev => !prev)} className="bg-meta-7 text-white px-6 py-3 rounded-xl shadow-md hover:bg-purple-700 transition w-full md:w-auto mb-4">
                Manage Subscription
              </button>
              <Link to="/groups" className="bg-meta-7 text-center text-white px-6 py-3 rounded-xl shadow-md hover:bg-purple-700 transition w-full md:w-auto mb-4 md:ml-4">
                Upload New Paper
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* END */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Confirm Action"
        message={`Are you sure you want to unsubscribe from ${userPackage?.type} ?`}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={confirmAction}
      />
      {showModal ? (
        <>
          <div
            className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none" onClick={handleBackgroundClick}
          >
            <div className="relative w-auto my-6 mx-auto sm:mx-12 lg:mx-24">
              {/*content*/}
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none px-16">
                {/*header*/}
                <div className="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                  <h3 className="w-full text-3xl font-semibold dark:text-white">
                    My subscription
                  </h3>

                  <button
                    className="absolute top-0 right-0 bg-gray dark:bg-black text-black background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    X
                  </button>
                </div>
                {/*body*/}
                <div className="flex-col">
                  <div className='text-black package text-lg text-center font-bold'>
                    {userPackage?.type} - registered at {moment(userPackage?.created_at).format("MMM Do, YYYY")}
                  </div>
                  <div className="flex-col min-w-[500px] items-center justify-center gap-1 border-r border-stroke px-4 dark:border-strokedark xsm:flex-row">
                    <h1 className='text-2xl text-white font=bold'>My Payments</h1>
                    <div className="mx-auto max-w-[600px] my-9 flex flex-col gap-[14px] grow">
                      <table className="table-auto dark:text-white">
                        <thead>
                          <tr>
                            <th className='text-center'>Amount</th>
                            <th className='text-center'>Status</th>
                            <th className='text-center'>Created At</th>
                            {/* <th className='text-center'>Action</th> */}
                          </tr>
                        </thead>
                        <tbody>
                          {payments?.map((item, idx) => (
                            <tr key={idx}>
                              <td className='text-center'>{item.amount}</td>
                              <td className='text-center'>{item.status}</td>
                              <td className='text-center'>{moment(item.created_at).format("MMM Do, YY HH:MM ")}</td>
                              {/* <td className='text-center'>
                                        {idx === 0 && item.refunded_at == null ? <button type="button" onClick={() => handleClickRefund(item.payment_id)} className="outline px-3 py-2 text-xs font-medium text-center text-primary bg-white rounded-lg hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800">refund</button> : null}
                                      </td> */}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
                {/*footer*/}
                <div className="flex items-center justify-between p-6 border-t border-solid border-blueGray-200 rounded-b">
                  {userPackage?.stripe_status === 'active' ?
                    <>
                      <button
                        className="bg-gray text-black dark:text-black background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                        type="button"
                        onClick={() => setShowModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="bg-danger text-white background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                        type="button"
                        onClick={() => { setConfirmModalOpen(true); setShowModal(false); }}
                      >
                        Unsubscribe
                      </button>
                    </>
                    : null}
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-75 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}

{showChangePasswordModal ? (
        <>
          <div
            className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none" onClick={handleBackgroundClick}
          >
            <div className="relative w-auto my-6 mx-auto sm:mx-12 lg:mx-24">
              <button className='text-4xl absolute right-1' onClick={() => setShowChangePasswordModal(false)}>x</button>

              {/*content*/}
              <ChangePassword />
            </div>
          </div>
          <div className="opacity-75 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}
    </MainLayout>
  );
};

export default Profile;
