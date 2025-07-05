document.addEventListener('DOMContentLoaded', () => {
    initializeChatbot();
});

function initializeChatbot() {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotInput = document.getElementById('chatbot-input-field');
    const chatbotMessages = document.getElementById('chatbot-messages');

    // Toggle chatbot window
    chatbotToggle.addEventListener('click', () => {
        chatbotWindow.classList.toggle('active');
    });

    // Close chatbot window
    chatbotClose.addEventListener('click', () => {
        chatbotWindow.classList.remove('active');
    });

    // Send message on button click
    chatbotSend.addEventListener('click', sendMessage);

    // Send message on Enter key
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Quick action buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-action')) {
            const action = e.target.getAttribute('data-action');
            handleQuickAction(action);
        }
    });

    function sendMessage() {
        const message = chatbotInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addMessage(message, 'user');
        chatbotInput.value = '';

        // Process message and get bot response
        setTimeout(() => {
            const response = processMessage(message);
            addMessage(response.text, 'bot', response.actions);
        }, 500);
    }

    function addMessage(text, sender, actions = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender}-message`;
        
        const messageContent = document.createElement('p');
        messageContent.textContent = text;
        messageDiv.appendChild(messageContent);

        if (actions && actions.length > 0) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'quick-actions';
            
            actions.forEach(action => {
                const button = document.createElement('button');
                button.className = 'quick-action';
                button.textContent = action.text;
                button.setAttribute('data-action', action.action);
                actionsDiv.appendChild(button);
            });
            
            messageDiv.appendChild(actionsDiv);
        }

        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function processMessage(message) {
        const lowerMessage = message.toLowerCase();

        // Greeting responses
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return {
                text: "Hello! Welcome to AutoRepairPro. I'm here to help you with your automotive service needs. What can I assist you with today?",
                actions: [
                    { text: "View Services", action: "services" },
                    { text: "Book Appointment", action: "booking" },
                    { text: "Check Status", action: "status" }
                ]
            };
        }

        // Services inquiry
        if (lowerMessage.includes('service') || lowerMessage.includes('what do you offer') || lowerMessage.includes('repair')) {
            return {
                text: "We offer a comprehensive range of automotive bodyshop services including paint jobs, dent repair, collision repair, and general maintenance. Would you like to see our full service list with pricing?",
                actions: [
                    { text: "View All Services", action: "services" },
                    { text: "Book Service", action: "booking" },
                    { text: "Get Quote", action: "quote" }
                ]
            };
        }

        // Booking inquiry
        if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
            const userRole = sessionStorage.getItem('userRole');
            if (userRole === 'customer') {
                return {
                    text: "To book an appointment, go to your dashboard and click 'Book Appointment'. You can select your vehicle, choose a service, and pick your preferred date and time. It's that simple!",
                    actions: [
                        { text: "Go to Booking", action: "navigate-booking" },
                        { text: "View Services", action: "services" }
                    ]
                };
            } else {
                return {
                    text: "To book an appointment, you'll need to create a customer account first. You can register on our login page and then access the booking system.",
                    actions: [
                        { text: "How to Register", action: "register" },
                        { text: "View Services", action: "services" }
                    ]
                };
            }
        }

        // Status inquiry
        if (lowerMessage.includes('status') || lowerMessage.includes('progress') || lowerMessage.includes('update')) {
            const userRole = sessionStorage.getItem('userRole');
            if (userRole === 'customer') {
                return {
                    text: "You can check your job status in the 'My Jobs' section of your dashboard. You'll see real-time updates on your vehicle's repair progress, from booking to completion.",
                    actions: [
                        { text: "View My Jobs", action: "navigate-jobs" },
                        { text: "Payment Info", action: "payment" }
                    ]
                };
            } else {
                return {
                    text: "To check job status, you'll need to log in as a customer. If you don't have an account, you can register to track your vehicle's repair progress.",
                    actions: [
                        { text: "Login Help", action: "login" },
                        { text: "Register Account", action: "register" }
                    ]
                };
            }
        }

        // Payment inquiry
        if (lowerMessage.includes('pay') || lowerMessage.includes('payment') || lowerMessage.includes('invoice') || lowerMessage.includes('bill')) {
            return {
                text: "Once your repair is completed, we'll generate an invoice. You can pay securely through your customer dashboard using credit/debit cards, UPI, or digital wallets. Payment is processed instantly!",
                actions: [
                    { text: "Payment Methods", action: "payment-methods" },
                    { text: "View Invoices", action: "navigate-history" }
                ]
            };
        }

        // Pricing inquiry
        if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('quote') || lowerMessage.includes('estimate')) {
            return {
                text: "Our pricing varies by service type. We offer competitive rates for all bodyshop services. You can view detailed pricing when booking, and we'll provide a complete estimate before starting any work.",
                actions: [
                    { text: "View Pricing", action: "services" },
                    { text: "Get Quote", action: "quote" },
                    { text: "Book Service", action: "booking" }
                ]
            };
        }

        // Hours/Location inquiry
        if (lowerMessage.includes('hours') || lowerMessage.includes('open') || lowerMessage.includes('location') || lowerMessage.includes('address')) {
            return {
                text: "We're open Monday through Friday, 8:00 AM to 6:00 PM, and Saturdays 9:00 AM to 4:00 PM. We're closed on Sundays. You can book appointments online 24/7 through our system!",
                actions: [
                    { text: "Book Now", action: "booking" },
                    { text: "Contact Info", action: "contact" }
                ]
            };
        }

        // Help with registration
        if (lowerMessage.includes('register') || lowerMessage.includes('sign up') || lowerMessage.includes('create account')) {
            return {
                text: "Creating an account is easy! Click 'Register' on the login page, fill in your details, and you'll have instant access to book appointments, track repairs, and manage payments.",
                actions: [
                    { text: "Registration Guide", action: "register" },
                    { text: "Login Help", action: "login" }
                ]
            };
        }

        // Emergency/urgent inquiry
        if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('asap') || lowerMessage.includes('immediate')) {
            return {
                text: "For urgent repairs, please call us directly or visit our shop. For non-emergency bookings, you can schedule through our online system. We'll do our best to accommodate urgent requests!",
                actions: [
                    { text: "Contact Info", action: "contact" },
                    { text: "Book Appointment", action: "booking" }
                ]
            };
        }

        // Insurance inquiry
        if (lowerMessage.includes('insurance') || lowerMessage.includes('claim') || lowerMessage.includes('coverage')) {
            return {
                text: "We work with most major insurance companies. When booking, please mention if this is an insurance claim. We can help coordinate with your insurance provider for a smooth process.",
                actions: [
                    { text: "Book Service", action: "booking" },
                    { text: "Contact Us", action: "contact" }
                ]
            };
        }

        // Default response for unrecognized queries
        return {
            text: "I'm here to help with AutoRepairPro services! I can assist with booking appointments, checking service status, pricing information, and general questions about our bodyshop services. What would you like to know?",
            actions: [
                { text: "View Services", action: "services" },
                { text: "Book Appointment", action: "booking" },
                { text: "Check Status", action: "status" },
                { text: "Contact Info", action: "contact" }
            ]
        };
    }

    async function handleQuickAction(action) {
        switch (action) {
            case 'services':
                try {
                    const response = await fetch('http://localhost:8080/api/services');
                    const services = await response.json();
                    
                    let servicesList = "Here are our available services:\n\n";
                    services.forEach(service => {
                        servicesList += `• ${service.serviceName} - $${service.price}\n`;
                        if (service.description) {
                            servicesList += `  ${service.description}\n`;
                        }
                        servicesList += "\n";
                    });
                    
                    addMessage(servicesList, 'bot', [
                        { text: "Book Service", action: "booking" },
                        { text: "Get Quote", action: "quote" }
                    ]);
                } catch (error) {
                    addMessage("Sorry, I couldn't load the services list right now. Please try again later or contact us directly.", 'bot');
                }
                break;

            case 'booking':
                addMessage("To book an appointment:\n\n1. Log in to your customer account\n2. Go to 'Book Appointment' tab\n3. Select your vehicle\n4. Choose a service\n5. Pick your preferred date and time\n6. Add any special notes\n7. Confirm your booking\n\nYou'll receive instant confirmation!", 'bot', [
                    { text: "Need Account?", action: "register" },
                    { text: "View Services", action: "services" }
                ]);
                break;

            case 'status':
                addMessage("To check your job status:\n\n1. Log in to your customer dashboard\n2. Go to 'My Jobs' section\n3. View real-time updates on your repairs\n4. See estimated completion times\n5. Get notified when ready for pickup\n\nYou can also check your service history anytime!", 'bot', [
                    { text: "Login Help", action: "login" },
                    { text: "Payment Info", action: "payment" }
                ]);
                break;

            case 'payment':
                addMessage("We accept multiple payment methods:\n\n• Credit/Debit Cards (Visa, MasterCard, etc.)\n• UPI (Google Pay, PhonePe, Paytm)\n• Digital Wallets\n• Cash (in-person)\n\nAll online payments are secure and processed instantly. You'll receive a receipt immediately after payment.", 'bot');
                break;

            case 'payment-methods':
                addMessage("Our secure payment options include:\n\n💳 Credit & Debit Cards\n📱 UPI Payments\n💰 Digital Wallets\n💵 Cash (at location)\n\nAll transactions are encrypted and secure. You can pay online through your customer dashboard once your service is completed.", 'bot');
                break;

            case 'contact':
                addMessage("Contact AutoRepairPro:\n\n📞 Phone: (555) 123-4567\n📧 Email: info@autorepairpro.com\n📍 Address: 123 Auto Street, Repair City\n🕒 Hours: Mon-Fri 8AM-6PM, Sat 9AM-4PM\n\nFor immediate assistance, call us directly. For non-urgent matters, you can book online anytime!", 'bot');
                break;

            case 'register':
                addMessage("Creating your account:\n\n1. Go to our registration page\n2. Enter your full name\n3. Choose a username\n4. Create a secure password\n5. Confirm your password\n6. Click 'Create Account'\n\nOnce registered, you can immediately start booking services and tracking your repairs!", 'bot');
                break;

            case 'login':
                addMessage("Having trouble logging in?\n\n• Make sure you're using the correct username and password\n• Check if Caps Lock is on\n• If you forgot your password, contact us for assistance\n• New users need to register first\n\nNeed help? We're here to assist you!", 'bot', [
                    { text: "Register Account", action: "register" },
                    { text: "Contact Support", action: "contact" }
                ]);
                break;

            case 'quote':
                addMessage("To get a service quote:\n\n1. Browse our services list to see base pricing\n2. Book a consultation for detailed estimates\n3. We'll assess your vehicle's needs\n4. Provide a comprehensive quote before starting work\n\nNo hidden fees - you'll know the exact cost upfront!", 'bot', [
                    { text: "View Services", action: "services" },
                    { text: "Book Consultation", action: "booking" }
                ]);
                break;

            case 'navigate-booking':
                const userRole = sessionStorage.getItem('userRole');
                if (userRole === 'customer') {
                    // Switch to booking tab if on customer dashboard
                    const bookingTab = document.querySelector('[data-tab="book-appointment"]');
                    if (bookingTab) {
                        bookingTab.click();
                        addMessage("I've taken you to the booking section. Select your vehicle and service to get started!", 'bot');
                    } else {
                        addMessage("Please navigate to your customer dashboard to access the booking section.", 'bot');
                    }
                } else {
                    addMessage("You'll need to log in as a customer to access the booking system. Please log in or create an account first.", 'bot');
                }
                break;

            case 'navigate-jobs':
                if (sessionStorage.getItem('userRole') === 'customer') {
                    const jobsTab = document.querySelector('[data-tab="my-jobs"]');
                    if (jobsTab) {
                        jobsTab.click();
                        addMessage("Here are your current jobs. You can see the status and progress of each repair.", 'bot');
                    } else {
                        addMessage("Please navigate to your customer dashboard to view your jobs.", 'bot');
                    }
                } else {
                    addMessage("Please log in as a customer to view your jobs.", 'bot');
                }
                break;

            case 'navigate-history':
                if (sessionStorage.getItem('userRole') === 'customer') {
                    const historyTab = document.querySelector('[data-tab="service-history"]');
                    if (historyTab) {
                        historyTab.click();
                        addMessage("Here's your complete service history including all invoices and payments.", 'bot');
                    } else {
                        addMessage("Please navigate to your customer dashboard to view your service history.", 'bot');
                    }
                } else {
                    addMessage("Please log in as a customer to view your service history.", 'bot');
                }
                break;

            default:
                addMessage("I'm not sure how to help with that. Please try asking about our services, booking appointments, or checking job status.", 'bot', [
                    { text: "View Services", action: "services" },
                    { text: "Book Appointment", action: "booking" },
                    { text: "Contact Us", action: "contact" }
                ]);
        }
    }
}