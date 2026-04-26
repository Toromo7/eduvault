"use client";

export default function TrendingMaterials() {
	const trendingMaterials = [
		{
			title: "CHM12 — Lab Report Template (UNN)",
			author: "@Student M",
			likes: "2.1M Likes",
			price: "0.30 XLM",
		},
		{
			title: "CHM12 — Lab Report Template (UNN)",
			author: "@Student M",
			likes: "2.1M Likes",
			price: "0.30 XLM",
		},
		{
			title: "CHM12 — Lab Report Template",
			author: "@Student M",
			likes: "2.1M Likes",
			price: "0.30 XLM",
		},
	];

	return (
		<div className="md:col-span-2">
			<div className="flex justify-between items-center mb-5">
				<h2 className="text-xl font-bold">Trending Study Materials</h2>
				<button className="text-blue-600 hover:underline text-sm font-medium">
					See All
				</button>
			</div>
			<div className="grid gap-4">
				{trendingMaterials.map((item, i) => (
					<div
						key={i}
						className="p-4 bg-white rounded-xl border border-gray-200 flex gap-4 hover:shadow-md transition"
					>
						<div className="w-32 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
							<span className="text-xs text-gray-600 font-medium">
								Get This!
							</span>
						</div>
						<div className="flex-1">
							<h3 className="font-semibold mb-1">{item.title}</h3>
							<p className="text-sm text-gray-500 mb-2">{item.author}</p>
							<div className="flex justify-between text-sm">
								<span className="text-gray-500">{item.likes}</span>
								<span className="font-semibold text-green-600">
									{item.price}
								</span>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
