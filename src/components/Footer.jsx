import { HeartHandshake, PackageCheck, ShieldCheck } from "lucide-react";

const trustPoints = [
  {
    icon: PackageCheck,
    title: "Fast Dispatch",
    text: "Orders are packed quickly with timely TwoSoul status updates.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Checkout",
    text: "Authenticated order flow with saved addresses and protected APIs.",
  },
  {
    icon: HeartHandshake,
    title: "Loved By Shoppers",
    text: "Crafted to deliver a premium scent journey from first click to doorstep.",
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        {trustPoints.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="footer-point">
              <Icon size={20} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          );
        })}
      </div>
      <p className="footer-note">TwoSoul Perfume Commerce Platform</p>
    </footer>
  );
}
