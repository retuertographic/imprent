import "../styles/seritene/quiz.css";
import { ProductFinderQuiz } from "@/components/sites/seritene/pages/ProductFinderQuiz";
import { pageMetadata } from "@/components/sites/seritene/pages/meta";

export const metadata = pageMetadata(
  "/encuentra-tu-producto/",
  "Encuentra tu producto personalizado",
  "Responde cuatro preguntas y encuentra ideas de ropa, merchandising, imprenta y soportes publicitarios para tu proyecto.",
);

export default function Page() {
  return <ProductFinderQuiz />;
}
