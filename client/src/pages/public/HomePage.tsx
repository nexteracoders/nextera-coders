import React from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ScrollReveal } from '../../components/common/ScrollReveal';
import { HeroSection } from './HomeSections/HeroSection';
import { PopularCoursesSection } from './HomeSections/PopularCoursesSection';
import { PracticeSection } from './HomeSections/PracticeSection';
import { MonthlyGrandContestSection } from './HomeSections/MonthlyGrandContestSection';
import { CategoriesSection } from './HomeSections/CategoriesSection';
import { RoadmapSection } from './HomeSections/RoadmapSection';
import { MentorsSection } from './HomeSections/MentorsSection';
import { LearnersSayingSection } from './HomeSections/LearnersSayingSection';
import { FAQSection } from './HomeSections/FAQSection';
import { CTASection } from './HomeSections/CTASection';

export const HomePage: React.FC = () => {
  useDocumentTitle('NextEra Coders', false);

  return (
    <div className="flex flex-col w-full">
      <HeroSection />
      <PopularCoursesSection />

      <ScrollReveal>
        <PracticeSection />
      </ScrollReveal>

      <ScrollReveal>
        <MonthlyGrandContestSection />
      </ScrollReveal>

      <ScrollReveal>
        <CategoriesSection />
      </ScrollReveal>

      <ScrollReveal>
        <RoadmapSection />
      </ScrollReveal>

      <ScrollReveal>
        <MentorsSection />
      </ScrollReveal>

      <ScrollReveal>
        <LearnersSayingSection />
      </ScrollReveal>

      <ScrollReveal>
        <FAQSection />
      </ScrollReveal>

      <ScrollReveal>
        <CTASection />
      </ScrollReveal>
    </div>
  );
};

