import React, { useState, useEffect } from 'react';
import { Section } from '../../../components/ui/Section';
import { SectionHeading } from '../../../components/ui/SectionHeading';
import { Accordion } from '../../../components/ui/Accordion';
import { faqService } from '../../../services/faq.service';
import { FAQ_DATA } from '../../../data/faq.data';

export const FAQSection: React.FC = () => {
  const [items, setItems] = useState(FAQ_DATA);

  useEffect(() => {
    faqService
      .getPublicFaqs()
      .then((res) => {
        if (res.faqs && res.faqs.length > 0) {
          setItems(
            res.faqs.map((f) => ({
              id: f.id,
              question: f.question,
              answer: f.answer,
            }))
          );
        }
      })
      .catch((err) => {
        console.error('Failed to load dynamic FAQs, using fallback:', err);
      });
  }, []);

  return (
    <Section variant="subtle" className="py-8 sm:py-12">
      <SectionHeading
        badge="Got Questions?"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about getting started with NextEra Coders Learning."
        highlightText="Frequently Asked Questions"
        className="mb-6 sm:mb-8"
      />
      <div className="max-w-3xl mx-auto">
        <Accordion items={items} />
      </div>
    </Section>
  );
};
