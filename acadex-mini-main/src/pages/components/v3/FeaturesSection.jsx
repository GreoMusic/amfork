import React from 'react';
import styled from 'styled-components';
import FeatureItem from './FeatureItem';
import HorizontalScrollFeature from './HorizontalScrollFeature';

const FeaturesContainer = styled.section`
  padding-top: 5rem;
`;

const FeaturesSection = ({ animationState }) => {
  // Feature data for standard feature items
  const features = [
    {
      id: 'feature1',
      title: 'Scary Fast Grading',
      paragraphs: [
        'Process hundreds of papers in minutes instead of hours. Acadex Mini\'s advanced AI analyzes student work with remarkable accuracy, allowing you to review and provide feedback at unprecedented speeds.',
        'Our proprietary algorithms extract key insights from essays, assignments, and tests, giving you a head start on evaluation while maintaining your high standards.'
      ]
    },
    {
      id: 'feature2',
      title: 'Personalized to You',
      paragraphs: [
        'Unlike other grading tools, Acadex Mini learns your unique grading style. Our Feedback Editor adapts to your preferences, creating a personalized grading experience that feels natural and intuitive.',
        'The more you use it, the more it understands your expectations, values, and feedback patterns—becoming an extension of your teaching philosophy.'
      ]
    },
    {
      id: 'feature4',
      title: 'Tailored Intelligence',
      paragraphs: [
        'Create custom rubrics that perfectly match your curriculum and teaching goals. Acadex Mini\'s intelligent framework adapts to your specific criteria, ensuring your academic standards are perfectly maintained.',
        'From simple pass/fail assessments to complex multi-dimensional rubrics, our system puts you in complete control of how work is evaluated.'
      ]
    },
    {
      id: 'feature5',
      title: 'Effortless UI',
      paragraphs: [
        'Our intuitive interface eliminates the learning curve. Acadex Mini is designed with educators in mind, allowing you to start grading within minutes of setup, with no complex configurations or technical knowledge required.',
        'Simple drag-and-drop functionality, customizable dashboards, and intelligent workflows make the grading process feel natural and efficient.'
      ]
    },
    {
      id: 'feature7',
      title: 'Powerful & Affordable',
      paragraphs: [
        'Acadex Mini offers flexible pricing that scales with your needs. From individual educators to entire institutions, our plans ensure you get powerful AI-assisted grading at a price that makes sense.',
        'With no long-term commitments and a free trial option, you can experience the full power of Acadex Mini before making a decision.'
      ]
    }
  ];

  // Horizontal scroll feature data
  const horizontalFeatures = [
    {
      id: 'horizontal1',
      panels: [
        {
          centered: false,
          title: 'Bulk Grading Mastery',
          paragraph: 'Acadex Mini excels at handling entire classes at once, maintaining perfect consistency across all assignments while respecting individual student work.',
          showImage: false
        },
        {
          darkBackground: true,
          centered: false,
          subtitle: '🚀 True Batch Processing',
          description: 'Grade entire classes simultaneously with perfect consistency while maintaining the personalized touch that students deserve.',
          showImage: true
        }
      ]
    },
    {
      id: 'horizontal2',
      panels: [
        {
          darkBackground: true,
          centered: false,
          subtitle: '🤖 Smart Partner',
          description: 'Sydney learns your preferences over time, becoming an increasingly valuable assistant that understands your unique teaching approach.',
          showImage: true
        },
        {
          centered: true,
          title: 'Sydney AI Assistant',
          paragraph: 'Meet Sydney, your personal AI assistant that adapts to your teaching style and provides intelligent suggestions to enhance your grading process.',
          showImage: false
        }
      ]
    }
  ];

  return (
    <FeaturesContainer id="features">
      {/* Feature 1 */}
      <FeatureItem 
        title={features[0].title} 
        paragraphs={features[0].paragraphs} 
        animationState={animationState} 
      />

      {/* Feature 2 */}
      <FeatureItem 
        title={features[1].title} 
        paragraphs={features[1].paragraphs} 
        animationState={animationState} 
      />

      {/* Horizontal Feature 1 */}
      <HorizontalScrollFeature 
        panels={horizontalFeatures[0].panels} 
        scrollProgress={animationState.horizontalScroll1} 
        animationState={animationState} 
      />

      {/* Feature 4 */}
      <FeatureItem 
        title={features[2].title} 
        paragraphs={features[2].paragraphs} 
        animationState={animationState} 
      />

      {/* Feature 5 */}
      <FeatureItem 
        title={features[3].title} 
        paragraphs={features[3].paragraphs} 
        animationState={animationState} 
      />

      {/* Horizontal Feature 2 */}
      <HorizontalScrollFeature 
        panels={horizontalFeatures[1].panels} 
        scrollProgress={animationState.horizontalScroll2} 
        animationState={animationState} 
      />

      {/* Feature 7 (Pricing) */}
      <FeatureItem 
        title={features[4].title} 
        paragraphs={features[4].paragraphs} 
        animationState={animationState} 
      />
    </FeaturesContainer>
  );
};

export default FeaturesSection;
