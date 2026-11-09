import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import DemoBar from "@/components/DemoBar";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "yourshelf (demo)",
  description: "Demo of yourshelf: one shelf for the movies, games and albums you love, with recommendations from friends.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geist.variable}>
      <body>
        <Header />
        <DemoBar />
        <main>
          <div className="container">{children}</div>
        </main>
      </body>
    </html>
  );
}
