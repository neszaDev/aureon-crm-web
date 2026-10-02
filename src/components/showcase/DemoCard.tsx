import { cn } from 'cn';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * One example block of a showcase page: a titled card with the example inside.
 * @param props Component props.
 * @param props.title Card title (an `h2`).
 * @param props.description One line under the title.
 * @param props.action Controls aligned to the right of the title.
 * @param props.className Extra classes for the card.
 * @param props.contentClassName Extra classes for the content area.
 * @param props.children The example.
 * @returns The card.
 */
export const DemoCard = (props: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) => (
  <Card className={cn('gap-0', props.className)}>
    <CardHeader className="border-b border-ink-200 pb-4">
      <CardTitle>
        <h2>{props.title}</h2>
      </CardTitle>
      {props.description && <CardDescription>{props.description}</CardDescription>}
      {props.action && <CardAction>{props.action}</CardAction>}
    </CardHeader>
    <CardContent className={cn('pt-5', props.contentClassName)}>{props.children}</CardContent>
  </Card>
);
