import React, { useState, useEffect, useRef } from 'react';
import { Check, Users, ChefHat, Calculator, X, Calendar, MapPin, Truck, Coffee, AlertCircle, Loader2 } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  description: string;
  bestFor: string;
  entrees: number;
  sides: number;
  features: string[];
}

interface EntreeItem {
  name: string;
  category: string;
  price: number;
}

interface SideItem {
  name: string;
  price: number;
}

interface AdditionalService {
  id: string;
  name: string;
  price: number;
  description: string;
  type: 'per_person' | 'quote_based';
}

interface ContactForm {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  eventDate: string;
  location: string;
  deliveryMethod: 'delivery' | 'pickup';
  time: string;
}

const packages: Package[] = [
  {
    id: 'kkc1',
    name: "Kaycee's Kitchen #1",
    subtitle: "KKC 1",
    price: 30,
    description: 'Economical and satisfying with crowd-pleasing classics',
    bestFor: 'Small gatherings or individual meals',
    entrees: 1,
    sides: 2,
    features: ['One Entrée', 'Two Sides', 'Rolls', 'Signature Salad']
  },
  {
    id: 'kkc2',
    name: "Kaycee's Kitchen #2",
    subtitle: "KKC 2",
    price: 38,
    description: 'Balanced selection with variety and generous portions',
    bestFor: 'Corporate lunches & mid-size events',
    entrees: 2,
    sides: 3,
    features: ['Two Entrées', 'Three Sides', 'Rolls', 'Signature Salad']
  },
  {
    id: 'kkc3',
    name: "Kaycee's Kitchen #3",
    subtitle: "KKC 3",
    price: 49,
    description: 'A premium package of Soul Food Exquisites designed to impress',
    bestFor: 'Weddings, banquets, or large-scale events',
    entrees: 3,
    sides: 4,
    features: ['Three Entrées', 'Four Sides', 'Rolls', 'Signature Salad']
  }
];

const entrees: EntreeItem[] = [
  // Chicken
  { name: 'Pan Roasted Chicken Breast (Optional Sauce: Citrus Glaze, Lemon Pepper, Honey Barbecue, Hot Mambo)', category: 'Chicken', price: 20 },
  { name: 'Southern Fried Chicken', category: 'Chicken', price: 20 },
  { name: 'Jamaican Style Jerk Chicken', category: 'Chicken', price: 20 },
  { name: 'Sliced Oven Roasted Turkey', category: 'Chicken', price: 20 },
  { name: 'Bourbon Chicken Tips', category: 'Chicken', price: 20 },
  
  // Pork
  { name: 'BBQ Pork Barbeque', category: 'Pork', price: 20 },
  { name: 'Sliced Honey Glazed Ham with Pineapple', category: 'Pork', price: 20 },
  { name: 'Thick Cut Grilled Pork Chops with Roasted Garlic and Bourbon Sauce', category: 'Pork', price: 20 },
  
  // Beef
  { name: 'Bacon Wrapped Meatloaf', category: 'Beef', price: 24 },
  { name: 'Braised Short Ribs', category: 'Beef', price: 24 },
  { name: 'Tender Beef Brisket with Caramelized Onions', category: 'Beef', price: 24 },
  { name: 'Bourbon Beef Tips', category: 'Beef', price: 24 },
  { name: 'Sliced Beef Sirloin', category: 'Beef', price: 24 },
  
  // Seafood
  { name: 'Shrimp and Grits', category: 'Seafood', price: 26 },
  { name: 'Glazed Salmon', category: 'Seafood', price: 26 },
  { name: 'Crab Cakes', category: 'Seafood', price: 28 },
  { name: 'Fried/Grilled Catfish Cakes', category: 'Seafood', price: 26 },
  { name: 'Fried/Grilled Shrimp Skewers', category: 'Seafood', price: 26 },
  
  // Pasta
  { name: 'Baked Rigatoni with Italian Meatballs in Marinara', category: 'Pasta', price: 22 },
  { name: 'Deep Dish Lasagna', category: 'Pasta', price: 22 },
  { name: 'Cajun Style Jambalaya: Chicken, Sausage and Shrimp', category: 'Pasta', price: 26 },
  { name: 'Chicken and Broccoli Alfredo', category: 'Pasta', price: 22 },
  { name: 'Rasta Pasta - Shrimp, Steak, Chicken', category: 'Pasta', price: 26 }
];

const sides: SideItem[] = [
  { name: 'Green Beans', price: 0 },
  { name: 'Honey Glazed Carrots', price: 0 },
  { name: 'Broccoli Casserole', price: 0 },
  { name: 'Sweet Corn', price: 0 },
  { name: 'Vegetable Medley', price: 0 },
  { name: 'Cauliflower Casserole', price: 0 },
  { name: 'Macaroni and Cheese', price: 0 },
  { name: 'Rice, White, Dirty, Pilaf or Spanish', price: 0 },
  { name: 'Roasted Red Potatoes', price: 0 },
  { name: 'Baked Beans', price: 0 },
  { name: 'Potato Salad', price: 0 },
  { name: 'Fried Cabbage', price: 0 }
];

const additionalServices: AdditionalService[] = [
  {
    id: 'beverage',
    name: 'Standard Beverage Service',
    price: 5,
    description: 'Includes soft drinks, water, and tea service',
    type: 'per_person'
  },
  {
    id: 'delivery',
    name: 'Delivery and Setup Fee',
    price: 0,
    description: 'Based on location & size - included in final quote',
    type: 'quote_based'
  },
  {
    id: 'staff',
    name: 'KKC Full Service Catering Staff',
    price: 0,
    description: 'Onsite staff available at $25/hr per staff member',
    type: 'quote_based'
  },
  {
    id: 'disposal',
    name: 'Chafing Dishes & Disposables Package',
    price: 0,
    description: 'Serving pieces, disposable plates, napkins, and cutlery',
    type: 'quote_based'
  }
];

function App() {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [guestCount, setGuestCount] = useState<number>(0);
  const [guestCountError, setGuestCountError] = useState<string>('');
  const [selectedEntrees, setSelectedEntrees] = useState<EntreeItem[]>([]);
  const [selectedSides, setSelectedSides] = useState<SideItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<AdditionalService[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [showContactForm, setShowContactForm] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [contactForm, setContactForm] = useState<ContactForm>({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    eventDate: '',
    location: '',
    deliveryMethod: 'delivery',
    time: ''
  });

  // Refs for auto-scrolling
  const guestCountRef = useRef<HTMLDivElement>(null);
  const entreeSelectionRef = useRef<HTMLDivElement>(null);
  const sideSelectionRef = useRef<HTMLDivElement>(null);
  const additionalServicesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedPackage && guestCount >= 15) {
      const basePrice = selectedPackage.price * guestCount;
      const entreesPrice = selectedEntrees.reduce((sum, entree) => sum + entree.price, 0) * guestCount;
      const servicesPrice = selectedServices
        .filter(service => service.type === 'per_person')
        .reduce((sum, service) => sum + service.price, 0) * guestCount;
      setTotalPrice(basePrice + entreesPrice + servicesPrice);
    } else {
      setTotalPrice(0);
    }
  }, [selectedPackage, guestCount, selectedEntrees, selectedServices]);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    setSelectedEntrees([]);
    setSelectedSides([]);
    setSelectedServices([]);
    setGuestCount(0);
    setGuestCountError('');
    
    // Auto-scroll to guest count section after a brief delay
    setTimeout(() => {
      scrollToSection(guestCountRef);
    }, 300);
  };

  const handleGuestCountChange = (count: number) => {
    setGuestCount(count);
    
    // Validate minimum guest count
    if (count > 0 && count < 15) {
      setGuestCountError('Minimum of 15 guests required for catering service');
      return;
    } else {
      setGuestCountError('');
    }
    
    // Auto-scroll to entree selection when valid guest count is entered
    if (count >= 15 && selectedPackage) {
      setTimeout(() => {
        scrollToSection(entreeSelectionRef);
      }, 300);
    }
  };

  const handleEntreeToggle = (entree: EntreeItem) => {
    if (!selectedPackage) return;
    
    const isSelected = selectedEntrees.find(e => e.name === entree.name);
    let newSelectedEntrees;
    
    if (isSelected) {
      newSelectedEntrees = selectedEntrees.filter(e => e.name !== entree.name);
    } else if (selectedEntrees.length < selectedPackage.entrees) {
      newSelectedEntrees = [...selectedEntrees, entree];
    } else {
      return;
    }
    
    setSelectedEntrees(newSelectedEntrees);
    
    // Auto-scroll to side selection when all entrees are selected
    if (newSelectedEntrees.length === selectedPackage.entrees) {
      setTimeout(() => {
        scrollToSection(sideSelectionRef);
      }, 300);
    }
  };

  const handleSideToggle = (side: SideItem) => {
    if (!selectedPackage) return;
    
    const isSelected = selectedSides.find(s => s.name === side.name);
    let newSelectedSides;
    
    if (isSelected) {
      newSelectedSides = selectedSides.filter(s => s.name !== side.name);
    } else if (selectedSides.length < selectedPackage.sides) {
      newSelectedSides = [...selectedSides, side];
    } else {
      return;
    }
    
    setSelectedSides(newSelectedSides);
    
    // Auto-scroll to additional services when all sides are selected
    if (newSelectedSides.length === selectedPackage.sides) {
      setTimeout(() => {
        scrollToSection(additionalServicesRef);
      }, 300);
    }
  };

  const handleServiceToggle = (service: AdditionalService) => {
    const isSelected = selectedServices.find(s => s.id === service.id);
    
    if (isSelected) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleContactFormChange = (field: keyof ContactForm, value: string) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Use localhost:8888 for local development, relative URL for production
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:8888/.netlify/functions/create-invoice'
        : '/.netlify/functions/create-invoice';
        
      console.log('Making request to:', apiUrl);
      console.log('Request data:', {
        package: selectedPackage,
        guestCount,
        entrees: selectedEntrees,
        sides: selectedSides,
        additionalServices: selectedServices,
        totalPrice,
        contactInfo: contactForm
      });
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
      package: selectedPackage,
      guestCount,
      entrees: selectedEntrees,
      sides: selectedSides,
      additionalServices: selectedServices,
      totalPrice,
      contactInfo: contactForm
        })
    });
    
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Response result:', result);
      
      if (result.success) {
        alert('Thank you for your quote request! A draft invoice has been created and Kaycee\'s Kitchen will contact you within 24 hours.');
        setShowContactForm(false);
      } else {
        alert('There was an error creating your quote. Please try again or contact Kaycee\'s Kitchen directly.');
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('There was an error submitting your quote. Please try again or contact Kaycee\'s Kitchen directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedEntrees = entrees.reduce((acc, entree) => {
    if (!acc[entree.category]) {
      acc[entree.category] = [];
    }
    acc[entree.category].push(entree);
    return acc;
  }, {} as Record<string, EntreeItem[]>);

  const isSelectionComplete = selectedPackage && 
    guestCount >= 15 && 
    selectedEntrees.length === selectedPackage.entrees && 
    selectedSides.length === selectedPackage.sides;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Kaycee's Kitchen
          </h1>
          <p className="text-xl md:text-2xl mb-2 opacity-90">
            Buffet Package Builder
          </p>
          <p className="text-lg opacity-80 max-w-3xl mx-auto">
            Choose the buffet package that fits your event—perfect for weddings, corporate functions, family gatherings, and more.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Package Selection */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Choose Your Buffet Package
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-2 ${
                  selectedPackage?.id === pkg.id 
                    ? 'border-orange-500 ring-4 ring-orange-200' 
                    : 'border-transparent hover:border-orange-200'
                }`}
                onClick={() => handlePackageSelect(pkg)}
              >
                <div className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {pkg.name}
                    </h3>
                    <p className="text-lg font-semibold text-orange-600 mb-3">
                      {pkg.subtitle}
                    </p>
                    <div className="text-4xl font-bold text-orange-600 mb-2">
                      ${pkg.price}
                      <span className="text-lg text-gray-600">/person</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {pkg.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="text-sm font-semibold text-orange-600 mb-2">
                      Best for:
                    </div>
                    <div className="text-gray-700 text-sm">
                      {pkg.bestFor}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {pkg.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <Check className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                    {selectedPackage?.id === pkg.id ? 'Selected' : 'Get Started'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Included Items - Moved here */}
        {selectedPackage && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Included with Every Package
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Check className="w-6 h-6 text-green-500 mr-3" />
                <span className="text-lg text-gray-800 font-medium">Fresh Dinner Rolls</span>
              </div>
              <div className="flex items-center">
                <Check className="w-6 h-6 text-green-500 mr-3" />
                <span className="text-lg text-gray-800 font-medium">Kaycee's Signature Salad</span>
              </div>
            </div>
          </div>
        )}

        {/* Guest Count Input */}
        {selectedPackage && (
          <div ref={guestCountRef} className="bg-white rounded-2xl shadow-lg p-8 mb-8 scroll-mt-8">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-orange-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">
                How many guests?
              </h3>
            </div>
            <div className="max-w-md">
              <input
                type="number"
                min="15"
                value={guestCount || ''}
                onChange={(e) => handleGuestCountChange(parseInt(e.target.value) || 0)}
                placeholder="Enter number of guests (minimum 15)"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-200 text-lg ${
                  guestCountError 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:border-orange-500'
                }`}
              />
              {guestCountError && (
                <div className="mt-3 flex items-center text-red-600">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm font-medium">{guestCountError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Entree Selection */}
        {selectedPackage && guestCount >= 15 && (
          <div ref={entreeSelectionRef} className="bg-white rounded-2xl shadow-lg p-8 mb-8 scroll-mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Select Your Entrées 
              <span className="text-lg font-normal text-gray-600">
                ({selectedEntrees.length} of {selectedPackage.entrees} selected)
              </span>
            </h3>
            
            {Object.entries(groupedEntrees).map(([category, categoryEntrees]) => (
              <div key={category} className="mb-8">
                <h4 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                  {category}
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {categoryEntrees.map((entree) => {
                    const isSelected = selectedEntrees.find(e => e.name === entree.name);
                    const canSelect = selectedEntrees.length < selectedPackage.entrees;
                    
                    return (
                      <div
                        key={entree.name}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50'
                            : canSelect
                            ? 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                            : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                        }`}
                        onClick={() => (canSelect || isSelected) && handleEntreeToggle(entree)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-1">
                              {entree.name}
                            </div>
                            {entree.price > 0 && (
                              <div className="text-sm text-orange-600 font-semibold">
                                +${entree.price}/person
                              </div>
                            )}
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'border-orange-500 bg-orange-500' 
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Side Selection */}
        {selectedPackage && selectedEntrees.length === selectedPackage.entrees && (
          <div ref={sideSelectionRef} className="bg-white rounded-2xl shadow-lg p-8 mb-8 scroll-mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Select Your Sides
              <span className="text-lg font-normal text-gray-600">
                ({selectedSides.length} of {selectedPackage.sides} selected)
              </span>
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              {sides.map((side) => {
                const isSelected = selectedSides.find(s => s.name === side.name);
                const canSelect = selectedSides.length < selectedPackage.sides;
                
                return (
                  <div
                    key={side.name}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50'
                        : canSelect
                        ? 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                    }`}
                    onClick={() => (canSelect || isSelected) && handleSideToggle(side)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900">
                        {side.name}
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-500' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Additional Services */}
        {selectedPackage && selectedSides.length === selectedPackage.sides && (
          <div ref={additionalServicesRef} className="bg-white rounded-2xl shadow-lg p-8 mb-8 scroll-mt-8">
            <div className="flex items-center mb-6">
              <Coffee className="w-6 h-6 text-orange-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">
                Additional Services
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Enhance your event with these optional services. Quote-based services will be included in your final estimate.
            </p>
            
            <div className="space-y-4">
              {additionalServices.map((service) => {
                const isSelected = selectedServices.find(s => s.id === service.id);
                
                return (
                  <div
                    key={service.id}
                    className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                    }`}
                    onClick={() => handleServiceToggle(service)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {service.name}
                          </h4>
                          {service.type === 'per_person' && service.price > 0 && (
                            <span className="ml-3 bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full">
                              ${service.price}/person
                            </span>
                          )}
                          {service.type === 'quote_based' && (
                            <span className="ml-3 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                              Quote Based
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600">
                          {service.description}
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ml-4 flex-shrink-0 ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-500' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">
                Ready to get your quote? Review your order summary below.
              </p>
            </div>
          </div>
        )}

        {/* Order Summary - Non-sticky, shows after additional services */}
        {selectedPackage && guestCount >= 15 && selectedSides.length === selectedPackage.sides && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <Calculator className="w-6 h-6 text-orange-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">
                Order Summary
              </h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">
                  {selectedPackage.name} × {guestCount} guests
                </span>
                <span className="font-semibold">
                  ${(selectedPackage.price * guestCount).toLocaleString()}
                </span>
              </div>
              
              {selectedEntrees.map((entree) => entree.price > 0 && (
                <div key={entree.name} className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">
                    {entree.name} × {guestCount} guests
                  </span>
                  <span className="font-semibold">
                    ${(entree.price * guestCount).toLocaleString()}
                  </span>
                </div>
              ))}

              {selectedServices
                .filter(service => service.type === 'per_person' && service.price > 0)
                .map((service) => (
                  <div key={service.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-700">
                      {service.name} × {guestCount} guests
                    </span>
                    <span className="font-semibold">
                      ${(service.price * guestCount).toLocaleString()}
                    </span>
                  </div>
                ))}

              {selectedServices.filter(service => service.type === 'quote_based').length > 0 && (
                <div className="py-2 border-b border-gray-200">
                  <div className="text-gray-700 mb-2 font-medium">Additional Services (Quote Based):</div>
                  {selectedServices
                    .filter(service => service.type === 'quote_based')
                    .map((service) => (
                      <div key={service.id} className="flex justify-between items-center text-sm text-gray-600 ml-4">
                        <span>• {service.name}</span>
                        <span className="font-medium text-blue-600">TBD</span>
                      </div>
                    ))}
                </div>
              )}
              
              <div className="flex justify-between items-center py-4 border-t-2 border-gray-300">
                <span className="text-xl font-bold text-gray-900">
                  Subtotal
                </span>
                <span className="text-3xl font-bold text-orange-600">
                  ${totalPrice.toLocaleString()}
                </span>
              </div>

              {selectedServices.filter(service => service.type === 'quote_based').length > 0 && (
                <div className="text-sm text-gray-600 text-center bg-blue-50 p-3 rounded-lg">
                  Final quote will include pricing for additional services based on your specific requirements.
                </div>
              )}
            </div>
            
            {isSelectionComplete && (
              <button 
                onClick={() => setShowContactForm(true)}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Get Quote & Contact Kaycee's Kitchen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Get Your Quote
                </h3>
                <button
                  onClick={() => setShowContactForm(false)}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitQuote} className="space-y-6">
                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={contactForm.firstName}
                      onChange={(e) => handleContactFormChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={contactForm.lastName}
                      onChange={(e) => handleContactFormChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name (Optional)
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    value={contactForm.companyName}
                    onChange={(e) => handleContactFormChange('companyName', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      disabled={isSubmitting}
                      value={contactForm.email}
                      onChange={(e) => handleContactFormChange('email', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      disabled={isSubmitting}
                      placeholder="(555) 123-4567"
                      value={contactForm.phone}
                      onChange={(e) => handleContactFormChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: (555) 123-4567 or +1-555-123-4567
                    </p>
                  </div>
                </div>

                {/* Event Details */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 text-orange-600 mr-2" />
                    Event Details
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        required
                        disabled={isSubmitting}
                        value={contactForm.eventDate}
                        onChange={(e) => handleContactFormChange('eventDate', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time *
                      </label>
                      <input
                        type="time"
                        required
                        disabled={isSubmitting}
                        value={contactForm.time}
                        onChange={(e) => handleContactFormChange('time', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 text-orange-600 mr-1" />
                      Event Location *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Enter full address"
                      value={contactForm.location}
                      onChange={(e) => handleContactFormChange('location', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <Truck className="w-4 h-4 text-orange-600 mr-1" />
                      Service Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-orange-300 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value="delivery"
                          disabled={isSubmitting}
                          checked={contactForm.deliveryMethod === 'delivery'}
                          onChange={(e) => handleContactFormChange('deliveryMethod', e.target.value as 'delivery' | 'pickup')}
                          className="text-orange-600 focus:ring-orange-500 disabled:opacity-50"
                        />
                        <span className="ml-3 font-medium text-gray-900">Delivery</span>
                      </label>
                      <label className={`flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-orange-300 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value="pickup"
                          disabled={isSubmitting}
                          checked={contactForm.deliveryMethod === 'pickup'}
                          onChange={(e) => handleContactFormChange('deliveryMethod', e.target.value as 'delivery' | 'pickup')}
                          className="text-orange-600 focus:ring-orange-500 disabled:opacity-50"
                        />
                        <span className="ml-3 font-medium text-gray-900">Pickup</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Order Summary in Modal */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Order Summary
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Package:</span>
                      <span className="font-medium">{selectedPackage?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Guests:</span>
                      <span className="font-medium">{guestCount}</span>
                    </div>
                    {selectedServices.filter(s => s.type === 'per_person').length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Additional Services:</span>
                        <span className="font-medium">
                          {selectedServices.filter(s => s.type === 'per_person').map(s => s.name).join(', ')}
                        </span>
                      </div>
                    )}
                    {selectedServices.filter(s => s.type === 'quote_based').length > 0 && (
                      <div className="space-y-1">
                        <div className="text-gray-700 font-medium">Quote-Based Services:</div>
                        {selectedServices.filter(s => s.type === 'quote_based').map(s => (
                          <div key={s.id} className="flex justify-between text-sm">
                            <span className="text-gray-600 ml-4">• {s.name}</span>
                            <span className="font-medium text-blue-600">TBD</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-300 pt-2">
                      <span className="text-lg font-bold text-gray-900">Subtotal:</span>
                      <span className="text-lg font-bold text-orange-600">${totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Quote Request'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;