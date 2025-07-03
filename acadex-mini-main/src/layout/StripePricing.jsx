import React, { useEffect } from "react";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

const StripePricingTable = () => {
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://js.stripe.com/v3/pricing-table.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);
    return React.createElement("stripe-pricing-table", {
        "pricing-table-id": "prctbl_1PIh9SEKP6hP2hdigEEnRKOz",
        "publishable-key": STRIPE_PUBLISHABLE_KEY,
    });
};

export default StripePricingTable;