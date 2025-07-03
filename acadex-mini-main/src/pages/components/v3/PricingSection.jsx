import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../provider/authProvider';
import { getReuest } from "../../../services/apiService";
import styled from 'styled-components';
import { motion } from 'framer-motion';

const PricingSection = () => {
    const [packages, setPackages] = useState([]);
    const { token } = useAuth();

    const fetchPackages = useCallback(() => {
        getReuest(`get/mini-packages`, token)
            .then(res => {
                const filteredPackages = res.packages.filter(item => item.title !== 'Demo');
                setPackages(filteredPackages);
            })
            .catch(error => {
                console.error('Error fetching packages:', error);
            });
    }, [token]);

    useEffect(() => {
        fetchPackages();
    }, [fetchPackages]);

    return (
        <StyledSection id="pricing">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="container"
            >
                <Header>
                    <SubHeading>Pricing Table</SubHeading>
                    <Heading>Our Pricing Plan</Heading>
                </Header>

                <CardsContainer>
                    {packages.map((pkg, index) => (
                        <PriceCard
                            key={pkg.title}
                            as={motion.div}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.2 }}
                            $type={pkg.title.toLowerCase()}
                        >
                            <CardTitle>{pkg.title}</CardTitle>
                            <CardSummary>{pkg.summary}</CardSummary>
                            <PriceTag>
                                <span className="amount">${pkg.price}</span>
                                <span className="period">/month</span>
                            </PriceTag>
                            <FeatureList>
                                {pkg.features.map((feature, idx) => (
                                    <FeatureItem key={idx}>
                                        <CheckIcon />
                                        <span>{feature}</span>
                                    </FeatureItem>
                                ))}
                            </FeatureList>
                            <SubscribeButton
                                to={token ? `/checkout/${pkg.title}` : '/register?redirect=price'}
                                $type={pkg.title.toLowerCase()}
                            >
                                Subscribe to {pkg.title}
                            </SubscribeButton>
                        </PriceCard>
                    ))}
                </CardsContainer>
            </motion.div>
        </StyledSection>
    );
};

const StyledSection = styled.section`
    background: linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%);
    padding: 120px 24px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    @media (max-width: 768px) {
        padding: 80px 16px;
    }
`;

const Header = styled.div`
    text-align: center;
    margin-bottom: 80px;
`;

const SubHeading = styled.span`
    color: #007bff;
    font-size: 1.25rem;
    font-weight: 600;
    display: block;
    margin-bottom: 16px;
`;

const Heading = styled.h2`
    font-size: 3rem;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.2;

    @media (max-width: 768px) {
        font-size: 2.5rem;
    }
`;

const CardsContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 32px;
    max-width: 1200px;
    margin: 0 auto;
`;

const PriceCard = styled.div`
    background: white;
    border-radius: 24px;
    padding: 40px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    transition: transform 0.3s ease;
    display: flex;
    flex-direction: column;
    
    &:hover {
        transform: translateY(-8px);
    }

    ${({ $type }) => $type === 'gold' && `
        background: linear-gradient(135deg, #faf0c5 0%, #E1C564 100%);
    `}
`;

const CardTitle = styled.h3`
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 16px;
    color: #1a1a1a;
`;

const CardSummary = styled.p`
    color: #666;
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 24px;
`;

const PriceTag = styled.div`
    margin: 32px 0;
    
    .amount {
        font-size: 3.5rem;
        font-weight: 800;
        color: #1a1a1a;
    }
    
    .period {
        font-size: 1.25rem;
        color: #666;
    }
`;

const FeatureList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0 0 32px 0;
`;

const FeatureItem = styled.li`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    font-size: 1.1rem;
    color: #444;
`;

const SubscribeButton = styled(Link)`
    padding: 16px 32px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1.1rem;
    text-align: center;
    text-decoration: none;
    transition: all 0.3s ease;
    margin-top: auto;
    
    ${({ $type }) => {
        switch ($type) {
            case 'bronze':
                return `
                    background: #CD7F32;
                    color: white;
                    &:hover { background: #B87129; }
                `;
            case 'silver':
                return `
                    background: #71706e;
                    color: white;
                    &:hover { background: #5A5958; }
                `;
            case 'gold':
                return `
                    background: #E1C564;
                    color: white;
                    &:hover { background: #C9B05A; }
                `;
            default:
                return `
                    background: #007bff;
                    color: white;
                    &:hover { background: #0056b3; }
                `;
        }
    }}
`;

const CheckIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            fill="currentColor"
        />
    </svg>
);

export default PricingSection;
