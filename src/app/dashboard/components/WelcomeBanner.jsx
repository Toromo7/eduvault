"use client";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";

export default function WelcomeBanner({ user }) {
    const firstName = (user?.fullName || "Student").split(" ")[0];
    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">👋 Welcome back, {firstName}!</h1>
            <div className="relative bg-[#FF9923] rounded-xl p-6 md:p-8 overflow-hidden min-h-[140px]">
                <div
                    className="absolute inset-0  pointer-events-none"
                    style={{ backgroundImage: "url(/walletflow.png)", backgroundSize: "cover", backgroundPosition: "center" }}
                />
                <div className="relative z-10 max-w-[60%]">
                    <p className="text-white mb-4 text-lg md:text-xl font-semibold leading-snug">
                        <span className="block">Discover and sell</span>
                        <span className="block">your own materials</span>
                    </p>
                    <button className="bg-[#1E1E2D] text-white px-5 py-2 rounded-full hover:bg-[#2E2E3D] shadow-sm">
                        Discover Now
                    </button>
                </div>
                <div className="absolute z-111111 right-[-10px] top-[-20px] w-[160px] h-[160px]">
                    <Image src="/images/stellar.png" alt="Stellar badge" width={160} height={160} className="drop-shadow-xl" />
                </div>
            </div>
        </div>
    );
}
