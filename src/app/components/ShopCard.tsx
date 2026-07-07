import { Link } from "react-router";
import shopAltImage from "../../assets/shop-alt.png";

export interface Shop {
  id: number;
  name: string;
  logo_url: string | null;
}

export default function ShopCard({ shop, className = "" }: { shop: Shop; className?: string }) {
  return (
    <Link to={`/?shop=${encodeURIComponent(shop.name)}`} className={`group block ${className}`}>
      <div className="relative h-28 md:h-[148px] rounded-2xl overflow-hidden border border-[#f0e4d4] bg-[#f8efe2] flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg">
        <img
          src={shop.logo_url ?? shopAltImage}
          alt={shop.name}
          className={shop.logo_url ? "w-full h-full object-cover" : "w-full h-full object-cover opacity-70"}
        />
      </div>
      <div className="font-['Plus_Jakarta_Sans'] text-[14.5px] font-bold text-[#2c2622] mt-2.5 truncate group-hover:text-[#d9764a] transition-colors">
        {shop.name}
      </div>
    </Link>
  );
}
