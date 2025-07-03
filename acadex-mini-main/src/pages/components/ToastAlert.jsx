import toast from 'react-hot-toast';

const colors = ['bg-[#04b20c]', 'bg-[#eab90f]', 'bg-[#e13f32]', 'bg-[#7a97ec]']; // 0-green, 1-yellow, 2-red, 3-blue


const ToastAlert = (title, msg, type = '0') => {
    console.log(title, 'TOAST')
    toast.custom((t) => (

        <div
            className={`${t.visible ? 'animate-enter' : 'animate-leave'
                }
      max-w-md w-full ${colors[type]} shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
            <div className="flex-1 w-0 p-4 ">
                <div className="flex items-start">

                    <div className="ml-3 flex-1">
                        <p className="text-base font-medium text-white">
                            {title}
                        </p>
                        <p className="mt-1 text-base text-white">
                            {msg}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex">

                <button
                    onClick={() => toast.dismiss(t.id)}
                    type="button"
                    className="mr-2 box-content rounded-none border-none opacity-100 hover:no-underline hover:opacity-50 focus:opacity-50 focus:shadow-none focus:outline-none text-white"
                    data-te-toast-dismiss
                    aria-label="Close">
                    <span
                        className="w-[1em] focus:opacity-100 disabled:pointer-events-none disabled:select-none disabled:opacity-25 [&.disabled]:pointer-events-none [&.disabled]:select-none [&.disabled]:opacity-25">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="h-6 w-6">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </span>
                </button>

            </div>
        </div>
    ))
};

export default ToastAlert;