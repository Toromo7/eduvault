"use client";

import Image from "next/image";
import Link from "next/link";
import { FaHeart } from "react-icons/fa";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useMarketplaceMaterials } from "@/hooks/api/useMaterials";
import { QueryStateProvider } from "@/components/common/QueryStateProvider";

export default function MarketPage() {
	const materialsQuery = useMarketplaceMaterials();

	const categories = [
		"Past Questions & Exam Papers",
		"Project & School Development",
		"Social Sciences",
		"Education & Languages",
		"Medical & Biological Sciences",
		"Engineering & Tech",
		"Entrepreneurship",
		"Study Tools",
		"Faculty Notes",
		"Community and Learning Resources",
	];

	return (
		<>
			<Navbar />

			{/* 🔹 Background Grid Pattern */}
			<div
				className="absolute inset-0 bg-[linear-gradient(to_right,#f2ede8_1px,transparent_1px),linear-gradient(to_bottom,#f2ede8_1px,transparent_1px)] bg-[size:40px_40px] opacity-70 pointer-events-none -z-1"
				aria-hidden="true"
			></div>

			<section className="flex min-h-screen bg-[#fffaf6]">
				{/* Sidebar Categories */}
				<aside className="hidden lg:block w-64 bg-white border-r border-gray-200 px-6 py-10 overflow-y-auto">
					<h3 className="text-sm font-semibold text-gray-700 mb-6">
						Categories
					</h3>
					<ul className="space-y-3 text-sm text-gray-600">
						{categories.map((category, i) => (
							<li
								key={i}
								className="cursor-pointer hover:text-blue-600 transition-all"
							>
								{category}
							</li>
						))}
					</ul>
				</aside>

				{/* Main Content */}
				<main className="flex-1 px-6 md:px-10 py-10 overflow-y-auto">
					{/* Top Banner */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-8 mb-10 flex flex-col md:flex-row justify-between items-center"
					>
						<div className="max-w-lg">
							<h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
								Discover More Study Materials
							</h1>
							<p className="text-gray-700 text-sm mb-4">
								Own your knowledge. Earn from your notes.
							</p>
							<button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-semibold transition-all">
								Become a Creator
							</button>
						</div>

						<div className="w-40 h-40 mt-6 md:mt-0 flex items-center justify-center">
							<Image
								src="/images/stellar.png"
								alt="Stellar token"
								width={144}
								height={144}
								className="object-contain"
							/>
						</div>
					</motion.div>

					{/* Filters */}
					<div className="flex flex-wrap items-center justify-between mb-8">
						<div className="flex flex-wrap items-center gap-4">
							<div className="flex items-center gap-2 text-gray-600 text-sm">
								<span className="font-medium">Filters:</span>
								<select className="border border-gray-300 bg-white rounded-md px-3 py-1 text-sm focus:ring-1 focus:ring-blue-300">
									<option>Category: All</option>
									<option>Social Sciences</option>
									<option>Engineering</option>
									<option>Pharmacy</option>
								</select>
								<select className="border border-gray-300 bg-white rounded-md px-3 py-1 text-sm focus:ring-1 focus:ring-blue-300">
									<option>Price Range</option>
								</select>
								<select className="border border-gray-300 bg-white rounded-md px-3 py-1 text-sm focus:ring-1 focus:ring-blue-300">
									<option>Latest Releases</option>
									<option>Most Downloaded</option>
								</select>
							</div>
						</div>

						<div className="text-sm text-gray-600 mt-4 md:mt-0">
							Sort by:{" "}
							<select className="border border-gray-300 bg-white rounded-md px-3 py-1 text-sm ml-1 focus:ring-1 focus:ring-blue-300">
								<option>Most Popular</option>
								<option>Newest</option>
							</select>
						</div>
					</div>

					{/* Study Materials Grid */}
					<QueryStateProvider 
						query={materialsQuery}
						renderData={(data) => (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.6 }}
								className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
							>
								{data.items?.map((material, i) => (
									<Link
										href={`/marketplace/${material._id}`}
										key={material._id || i}
										className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 block"
									>
										{/* Thumbnail */}
										<div className="relative w-full h-44 bg-gray-100">
											<Image
												src={material.image || material.thumbnail || "/images/image5.jpg"}
												alt={material.title}
												fill
												className="object-cover"
											/>
											<button className="absolute top-3 left-3 bg-white text-xs px-3 py-1 rounded-full shadow-sm text-gray-700 font-medium hover:bg-gray-50 transition">
												Get This!
											</button>
										</div>

										{/* Info */}
										<div className="p-4">
											<h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
												{material.title}
											</h3>
											<p className="text-xs text-gray-500 mb-3">
												by {material.author || material.creator || "Anonymous"}
											</p>

											<div className="flex justify-between items-center text-xs text-gray-500">
												<div className="flex items-center gap-1">
													<FaHeart className="text-pink-500" />
													<span>{material.likes || 0} Likes</span>
												</div>
												<span>Price</span>
											</div>

											<div className="flex justify-between items-center mt-1">
												<span className="text-sm font-semibold text-gray-800">
													{material.price} {material.currency || "XLM"}
												</span>
												<span className="text-xs text-gray-400">{material.currency || "XLM"}</span>
											</div>
										</div>
									</Link>
								))}
							</motion.div>
						)}
					/>

					{/* Pagination */}
					{materialsQuery.data?.totalPages > 1 && (
						<div className="flex items-center justify-between mt-12 text-sm text-gray-600">
							<button className="border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-100">
								Previous
							</button>
							<div className="flex items-center gap-2">
								{Array.from({ length: materialsQuery.data.totalPages }, (_, i) => i + 1).map((num) => (
									<button
										key={num}
										className={`w-8 h-8 flex items-center justify-center rounded-md ${
											num === materialsQuery.data.page
												? "bg-blue-600 text-white"
												: "bg-white border border-gray-300 hover:bg-gray-100"
										}`}
									>
										{num}
									</button>
								))}
							</div>
							<button className="border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-100">
								Next
							</button>
						</div>
					)}
				</main>
			</section>
		</>
	);
}
