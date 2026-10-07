import React from 'react';
import { Section } from '../../../components/ui/Section';
import { SectionHeading } from '../../../components/ui/SectionHeading';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { PROJECTS_DATA } from '../../../data/projects.data';
import { CheckCircle2 } from 'lucide-react';

export const ProjectsSection: React.FC = () => {
  return (
    <Section variant="subtle">
      <SectionHeading
        badge="Real-World Portfolio"
        title="Build Enterprise-Grade Software Projects"
        subtitle="Don't just write algorithms. Construct multi-tenant platforms, auth gateways, and distributed cloud applications."
        highlightText="Enterprise-Grade Software"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PROJECTS_DATA.map((proj, idx) => (
          <Card key={idx} variant="elevated" className="flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={proj.level === 'Advanced' ? 'warning' : 'info'}>{proj.level}</Badge>
                <span className="text-xs font-mono text-slate-400">Architecture Blueprint</span>
              </div>
              <CardTitle className="text-lg font-bold">{proj.title}</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">{proj.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-semibold uppercase text-slate-400">Core Features:</span>
                {proj.keyFeatures.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-dark-800">
                {proj.techStack.map((tech) => (
                  <span key={tech} className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-dark-850 text-slate-600 dark:text-slate-400">
                    {tech}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
};
