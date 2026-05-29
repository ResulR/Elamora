import { BucketSelector } from "./BucketSelector";
import { FlowerSelector } from "./FlowerSelector";
import { BalloonSelector } from "./BalloonSelector";
import { ColorSelector } from "./ColorSelector";
import { PersonalizationFields } from "./PersonalizationFields";

interface Step {
  index: number;
  title: string;
  description: string;
  body: React.ReactNode;
}

const steps: Step[] = [
  { index: 1, title: "Choose your bucket", description: "The base of your composition.", body: <BucketSelector /> },
  { index: 2, title: "Add flowers", description: "Build your bouquet.", body: <FlowerSelector /> },
  { index: 3, title: "Add balloons", description: "Add a festive touch.", body: <BalloonSelector /> },
  { index: 4, title: "Choose a color", description: "Create a harmonious look.", body: <ColorSelector /> },
  { index: 5, title: "Personalization", description: "Name & message.", body: <PersonalizationFields /> },
];

export function ConfiguratorPanel() {
  return (
    <div className="space-y-6">
      {steps.map((s) => (
        <section key={s.index} className="bg-surface/70 border border-border/60 rounded-2xl p-5 shadow-soft">
          <header className="flex items-start gap-3 mb-4">
            <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
              {s.index}
            </span>
            <div>
              <h3 className="font-display text-base leading-tight">{s.title}</h3>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </div>
          </header>
          {s.body}
        </section>
      ))}
    </div>
  );
}
