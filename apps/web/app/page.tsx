import program from "../../../docs/curriculum/program.json";
import { Workspace } from "../components/workspace";
export default function Home() {
  return <Workspace program={program} />;
}
