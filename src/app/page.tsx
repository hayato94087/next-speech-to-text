import { Recording } from "@/components/recording";
import { type FC } from "react";

const Home: FC = () => {
  return (
    <main className="flex flex-col items-center min-h-screen">
      <Recording />
    </main>
  );
};

export default Home;