// Global variables
let currentStep = 0;
let selectedPlanType = 'both';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    incrementVisitCount(); // This will also update the display
    setupEventListeners();
    updatePlanTypeVisibility();
});

// Increment visit count on page load/reload
async function incrementVisitCount() {
    try {
        const response = await fetch('/api/increment-visit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const data = await response.json();
        // Update the display with the new count
        if (data.totalVisits !== undefined) {
            document.getElementById('generationCount').textContent = data.totalVisits;
        }
    } catch (error) {
        console.error('Error incrementing visit count:', error);
        // Fallback: try to load current visit count
        loadVisitCount();
    }
}

// Load visit count from server
async function loadVisitCount() {
    try {
        const response = await fetch('/api/visit-count');
        const data = await response.json();
        document.getElementById('generationCount').textContent = data.totalVisits;
    } catch (error) {
        console.error('Error loading visit count:', error);
        document.getElementById('generationCount').textContent = '0';
    }
}

// Load generation count from server
async function loadGenerationCount() {
    try {
        const response = await fetch('/api/generation-count');
        const data = await response.json();
        document.getElementById('generationCount').textContent = data.totalGenerations;
    } catch (error) {
        console.error('Error loading generation count:', error);
        document.getElementById('generationCount').textContent = '0';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Plan type selection
    document.querySelectorAll('.plan-option').forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            document.querySelectorAll('.plan-option').forEach(opt => opt.classList.remove('selected'));
            // Add selected class to clicked option
            this.classList.add('selected');
            selectedPlanType = this.dataset.plan;
            updatePlanTypeVisibility();
        });
    });

    // Form submission
    document.getElementById('fitnessForm').addEventListener('submit', function(e) {
        e.preventDefault();
        generatePlan();
    });

    // Real-time form validation
    const requiredFields = document.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', validateField);
        field.addEventListener('input', validateField);
    });
}

// Update visibility based on plan type
function updatePlanTypeVisibility() {
    const workoutSections = document.querySelectorAll('.workout-only');
    const dietSections = document.querySelectorAll('.diet-only');

    workoutSections.forEach(section => {
        if (selectedPlanType === 'workout' || selectedPlanType === 'both') {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });

    dietSections.forEach(section => {
        if (selectedPlanType === 'diet' || selectedPlanType === 'both') {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });

    // Update required fields based on plan type
    updateRequiredFields();
}

// Update required fields based on plan type
function updateRequiredFields() {
    // Reset all required states
    document.querySelectorAll('input, select').forEach(field => {
        if (field.closest('.workout-only') || field.closest('.diet-only')) {
            field.required = false;
        }
    });

    // Set required fields based on plan type
    if (selectedPlanType === 'workout' || selectedPlanType === 'both') {
        document.querySelectorAll('.workout-only [name="targetMuscles"]').forEach(field => {
            // At least one target muscle should be selected, but we'll validate this separately
        });
    }

    if (selectedPlanType === 'diet' || selectedPlanType === 'both') {
        document.querySelectorAll('.diet-only [name="dietRestrictions"]').forEach(field => {
            // At least one diet restriction should be selected, but we'll validate this separately
        });
    }
}

// Field validation
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    // Remove previous error styling
    field.classList.remove('error');
    
    // Basic validation
    if (field.required && !value) {
        field.classList.add('error');
        return false;
    }
    
    // Age validation
    if (field.name === 'age') {
        const age = parseInt(value);
        if (age < 13 || age > 25) {
            field.classList.add('error');
            showToast('Age must be between 13 and 25', 'error');
            return false;
        }
    }
    
    return true;
}

// Navigation functions
function nextStep() {
    if (currentStep === 0) {
        // Validate plan type selection
        if (!selectedPlanType) {
            showToast('Please select a plan type', 'error');
            return;
        }
        
        document.getElementById('planTypeStep').classList.add('hidden');
        document.getElementById('questionnaireStep').classList.remove('hidden');
        currentStep = 1;
    }
}

function prevStep() {
    if (currentStep === 1) {
        document.getElementById('questionnaireStep').classList.add('hidden');
        document.getElementById('planTypeStep').classList.remove('hidden');
        currentStep = 0;
    }
}

// Form data collection
function collectFormData() {
    const formData = new FormData(document.getElementById('fitnessForm'));
    const data = {
        planType: selectedPlanType
    };
    
    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            // Handle multiple values (checkboxes)
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }
    
    // Handle checkboxes that weren't selected
    ['targetGoals', 'targetMuscles', 'dietRestrictions'].forEach(field => {
        if (!data[field]) {
            data[field] = [];
        } else if (!Array.isArray(data[field])) {
            data[field] = [data[field]];
        }
    });
    
    // Convert numeric fields
    ['age', 'gymBudget', 'equipmentBudget', 'foodBudget', 'supplementBudget'].forEach(field => {
        if (data[field]) {
            data[field] = parseInt(data[field]) || 0;
        }
    });
    
    return data;
}

// Form validation
function validateForm(data) {
    const errors = [];
    
    // Basic required fields
    if (!data.age || data.age < 13 || data.age > 25) {
        errors.push('Please enter a valid age between 13 and 25');
    }
    
    if (!data.gender) {
        errors.push('Please select your gender');
    }
    
    if (!data.height || !data.weight) {
        errors.push('Please enter your height and weight');
    }
    
    if (!data.fitnessLevel) {
        errors.push('Please select your fitness level');
    }
    
    if (!data.timeAvailability) {
        errors.push('Please select your time availability');
    }
    
    if (!data.targetGoals || data.targetGoals.length === 0) {
        errors.push('Please select at least one goal');
    }
    
    // Plan-specific validation
    if ((selectedPlanType === 'workout' || selectedPlanType === 'both') && 
        (!data.targetMuscles || data.targetMuscles.length === 0)) {
        errors.push('Please select at least one target muscle group');
    }
    
    if ((selectedPlanType === 'diet' || selectedPlanType === 'both') && 
        (!data.dietRestrictions || data.dietRestrictions.length === 0)) {
        errors.push('Please select at least one dietary preference');
    }
    
    return errors;
}

// Generate plan
async function generatePlan() {
    try {
        // Collect and validate form data
        const formData = collectFormData();
        const validationErrors = validateForm(formData);
        
        if (validationErrors.length > 0) {
            showToast(validationErrors[0], 'error');
            return;
        }
        
        // Show loading step
        document.getElementById('questionnaireStep').classList.add('hidden');
        document.getElementById('loadingStep').classList.remove('hidden');
        currentStep = 2;
        
        // Make API call
        const response = await fetch('/api/generate-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Note: generationCount element now shows visit count, not generation count
        // Generation count is tracked but not displayed in the UI
        
        // Display results
        displayResults(result.plan, result.planType);
        
    } catch (error) {
        console.error('Error generating plan:', error);
        showToast('Failed to generate plan. Please try again.', 'error');
        
        // Go back to questionnaire
        document.getElementById('loadingStep').classList.add('hidden');
        document.getElementById('questionnaireStep').classList.remove('hidden');
        currentStep = 1;
    }
}

// Display results
function displayResults(plan, planType) {
    const resultsContent = document.getElementById('resultsContent');
    
    // Format the plan text for better display
    const formattedPlan = formatPlanText(plan, planType);
    resultsContent.innerHTML = formattedPlan;
    
    // Show results step
    document.getElementById('loadingStep').classList.add('hidden');
    document.getElementById('resultsStep').classList.remove('hidden');
    currentStep = 3;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Format plan text for better display with rich UI
function formatPlanText(plan, planType) {
    // Parse the plan into structured sections
    const sections = parsePlanSections(plan);
    
    // Add plan type indicator
    const planTypeIndicator = `
        <div class="plan-type-indicator">
            <span class="plan-badge">${getPlanTypeBadge(planType)}</span>
        </div>
    `;
    
    // Create structured UI
    let formattedHTML = planTypeIndicator + '<div class="plan-container">';
    
    sections.forEach(section => {
        formattedHTML += createSectionUI(section);
    });
    
    formattedHTML += '</div>';
    
    return formattedHTML;
}

// Parse plan into structured sections
function parsePlanSections(plan) {
    const sections = [];
    const lines = plan.split('\n');
    let currentSection = null;
    let currentContent = [];
    
    for (let line of lines) {
        const trimmedLine = line.trim();
        
        // Detect section headers
        if (trimmedLine.match(/^\d+\.\s+[A-Z\s]+:$/)) {
            if (currentSection) {
                sections.push({
                    title: currentSection,
                    content: currentContent.join('\n').trim(),
                    type: getSectionType(currentSection)
                });
            }
            currentSection = trimmedLine.replace(/^\d+\.\s+/, '').replace(':', '');
            currentContent = [];
        } else if (trimmedLine && currentSection) {
            currentContent.push(line);
        }
    }
    
    // Add the last section
    if (currentSection) {
        sections.push({
            title: currentSection,
            content: currentContent.join('\n').trim(),
            type: getSectionType(currentSection)
        });
    }
    
    return sections;
}

// Determine section type for styling
function getSectionType(title) {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('summary') || lowerTitle.includes('plan')) return 'summary';
    if (lowerTitle.includes('schedule') || lowerTitle.includes('workout') || lowerTitle.includes('diet')) return 'schedule';
    if (lowerTitle.includes('tip') || lowerTitle.includes('note')) return 'tips';
    if (lowerTitle.includes('budget')) return 'budget';
    if (lowerTitle.includes('progress') || lowerTitle.includes('track')) return 'progress';
    return 'default';
}

// Create UI for each section
function createSectionUI(section) {
    const icon = getSectionIcon(section.type);
    const content = formatSectionContent(section.content, section.type);
    
    return `
        <div class="plan-section plan-section-${section.type}">
            <div class="section-header">
                <i class="${icon}"></i>
                <h3>${section.title}</h3>
            </div>
            <div class="section-content">
                ${content}
            </div>
        </div>
    `;
}

// Get icon for section type
function getSectionIcon(type) {
    const icons = {
        'summary': 'fas fa-clipboard-list',
        'schedule': 'fas fa-calendar-alt',
        'tips': 'fas fa-lightbulb',
        'budget': 'fas fa-dollar-sign',
        'progress': 'fas fa-chart-line',
        'default': 'fas fa-info-circle'
    };
    return icons[type] || icons.default;
}

// Format section content based on type
function formatSectionContent(content, type) {
    if (type === 'schedule') {
        return formatScheduleContent(content);
    } else if (type === 'tips') {
        return formatTipsContent(content);
    } else if (type === 'budget') {
        return formatBudgetContent(content);
    } else {
        return formatDefaultContent(content);
    }
}

// Format schedule content with cards
function formatScheduleContent(content) {
    const days = content.split(/Day \d+:/).filter(day => day.trim());
    let html = '<div class="schedule-grid">';
    
    days.forEach((day, index) => {
        const dayNumber = index + 1;
        const dayContent = day.trim();
        
        if (dayContent) {
            const exercises = extractExercises(dayContent);
            const isRestDay = dayContent.toLowerCase().includes('rest');
            
            html += `
                <div class="day-card ${isRestDay ? 'rest-day' : 'workout-day'}">
                    <div class="day-header">
                        <span class="day-number">Day ${dayNumber}</span>
                        ${isRestDay ? '<i class="fas fa-bed"></i>' : '<i class="fas fa-dumbbell"></i>'}
                    </div>
                    <div class="day-content">
                        ${isRestDay ? 
                            `<div class="rest-message">${dayContent}</div>` :
                            `<div class="exercise-list">${exercises}</div>`
                        }
                    </div>
                </div>
            `;
        }
    });
    
    html += '</div>';
    return html;
}

// Extract exercises from day content
function extractExercises(dayContent) {
    const lines = dayContent.split('\n').filter(line => line.trim());
    let exercises = '';
    
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('**') && !trimmed.startsWith('-')) {
            exercises += `<div class="exercise-item">${trimmed}</div>`;
        }
    });
    
    return exercises || `<div class="exercise-item">${dayContent}</div>`;
}

// Format tips content
function formatTipsContent(content) {
    const tips = content.split(/\n\s*-\s*/).filter(tip => tip.trim());
    let html = '<div class="tips-container">';
    
    tips.forEach(tip => {
        if (tip.trim()) {
            html += `
                <div class="tip-item">
                    <i class="fas fa-check-circle"></i>
                    <span>${tip.trim()}</span>
                </div>
            `;
        }
    });
    
    html += '</div>';
    return html;
}

// Format budget content
function formatBudgetContent(content) {
    const lines = content.split('\n').filter(line => line.trim());
    let html = '<div class="budget-breakdown">';
    
    lines.forEach(line => {
        if (line.trim()) {
            html += `<div class="budget-item">${line.trim()}</div>`;
        }
    });
    
    html += '</div>';
    return html;
}

// Format default content
function formatDefaultContent(content) {
    // Convert basic markdown-like formatting
    let formatted = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    return `<p>${formatted}</p>`;
}

// Get plan type badge
function getPlanTypeBadge(planType) {
    switch (planType) {
        case 'workout':
            return '<i class="fas fa-dumbbell"></i> Workout Plan';
        case 'diet':
            return '<i class="fas fa-apple-alt"></i> Diet Plan';
        case 'both':
            return '<i class="fas fa-heart"></i> Complete Fitness & Nutrition Plan';
        default:
            return '<i class="fas fa-star"></i> Personalized Plan';
    }
}

// Start over function
function startOver() {
    // Reset form
    document.getElementById('fitnessForm').reset();
    
    // Reset plan type selection
    document.querySelectorAll('.plan-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelector('.plan-option[data-plan="both"]').classList.add('selected');
    selectedPlanType = 'both';
    
    // Reset steps
    document.getElementById('resultsStep').classList.add('hidden');
    document.getElementById('planTypeStep').classList.remove('hidden');
    currentStep = 0;
    
    // Update visibility
    updatePlanTypeVisibility();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Toast notification system
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : '#28a745'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    // Add animation styles
    if (!document.querySelector('#toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add to page
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 5000);
}

// Add error styling to CSS dynamically
if (!document.querySelector('#error-styles')) {
    const errorStyles = document.createElement('style');
    errorStyles.id = 'error-styles';
    errorStyles.textContent = `
        .form-group input.error,
        .form-group select.error {
            border-color: #dc3545 !important;
            background-color: #fff5f5;
        }
        
        .plan-type-indicator {
            margin-bottom: 20px;
            text-align: center;
        }
        
        .plan-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: 600;
            display: inline-block;
        }
        
        .formatted-plan {
            line-height: 1.8;
        }
        
        .formatted-plan h1,
        .formatted-plan h2,
        .formatted-plan h3 {
            color: #667eea;
            margin: 25px 0 15px 0;
        }
        
        .formatted-plan h1 {
            font-size: 1.8rem;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        
        .formatted-plan h2 {
            font-size: 1.5rem;
        }
        
        .formatted-plan h3 {
            font-size: 1.3rem;
        }
        
        .formatted-plan ul,
        .formatted-plan ol {
            margin: 15px 0;
            padding-left: 20px;
        }
        
        .formatted-plan li {
            margin: 8px 0;
            line-height: 1.6;
        }
        
        .formatted-plan strong {
            color: #333;
        }
        
        .formatted-plan em {
            color: #666;
        }
    `;
    document.head.appendChild(errorStyles);
}
