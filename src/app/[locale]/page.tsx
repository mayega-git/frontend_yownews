import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { StatsBar } from '@/components/landing/StatsBar';
import { BlogsSection } from '@/components/landing/BlogsSection';
import { PodcastsSection } from '@/components/landing/PodcastsSection';
import { CoursesSection } from '@/components/landing/CoursesSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { CtaBanner } from '@/components/landing/CtaBanner';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <StatsBar />
        <BlogsSection />
        <PodcastsSection />
        <CoursesSection />
        <FeaturesSection />
        <TestimonialsSection />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
