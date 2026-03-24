const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    const skillsData = [
        { name: 'JavaScript', category: 'Programming', description: 'Core web programming language for building interactive UIs and server-side apps.', icon: '⚡', tags: JSON.stringify(['web', 'frontend', 'backend']) },
        { name: 'Python', category: 'Programming', description: 'Versatile language used in data science, ML, automation, and web backends.', icon: '🐍', tags: JSON.stringify(['data', 'ml', 'backend']) },
        { name: 'React', category: 'Frontend', description: 'A declarative, component-based JavaScript library for building user interfaces.', icon: '⚛️', tags: JSON.stringify(['frontend', 'ui', 'web']) },
        { name: 'Node.js', category: 'Backend', description: 'JavaScript runtime for building scalable network applications and APIs.', icon: '🟢', tags: JSON.stringify(['backend', 'server', 'api']) },
        { name: 'SQL', category: 'Database', description: 'Standard language for managing relational databases and complex queries.', icon: '🗃️', tags: JSON.stringify(['database', 'data']) },
        { name: 'Machine Learning', category: 'Data Science', description: 'Building systems that learn from data to make predictions and decisions.', icon: '🤖', tags: JSON.stringify(['ml', 'ai', 'data']) },
        { name: 'System Design', category: 'Architecture', description: 'Designing scalable, reliable, and maintainable large-scale systems.', icon: '🏗️', tags: JSON.stringify(['architecture', 'backend']) },
        { name: 'TypeScript', category: 'Programming', description: 'Typed superset of JavaScript that compiles to plain JavaScript.', icon: '🔷', tags: JSON.stringify(['frontend', 'backend', 'types']) },
        { name: 'Docker', category: 'DevOps', description: 'Platform for containerizing applications for consistent deployment.', icon: '🐳', tags: JSON.stringify(['devops', 'containers']) },
        { name: 'Data Structures', category: 'Computer Science', description: 'Fundamental concepts for organizing and storing data efficiently.', icon: '📊', tags: JSON.stringify(['cs', 'algorithms']) },
        { name: 'Go', category: 'Backend', description: 'Fast, statically typed, compiled language created at Google.', icon: '🐹', tags: JSON.stringify(['backend', 'performance', 'systems']) },
        { name: 'Rust', category: 'Programming', description: 'Systems programming language that runs blazingly fast and guarantees memory safety.', icon: '🦀', tags: JSON.stringify(['systems', 'performance', 'safety']) },
        { name: 'AWS', category: 'Cloud', description: 'Comprehensive, evolving cloud computing platform provided by Amazon.', icon: '☁️', tags: JSON.stringify(['cloud', 'devops', 'infrastructure']) },
        { name: 'Kubernetes', category: 'DevOps', description: 'Open-source system for automating deployment, scaling, and management of containerized applications.', icon: '☸️', tags: JSON.stringify(['devops', 'containers', 'scaling']) },
        { name: 'GraphQL', category: 'API', description: 'A query language for your API, and a server-side runtime for executing queries.', icon: '🕸️', tags: JSON.stringify(['api', 'backend', 'frontend']) },
        { name: 'MongoDB', category: 'Database', description: 'Document-oriented NoSQL database used for high volume data storage.', icon: '🍃', tags: JSON.stringify(['database', 'nosql', 'data']) },
        { name: 'Next.js', category: 'Fullstack', description: 'The React Framework for the Web spanning client and server technologies.', icon: '▲', tags: JSON.stringify(['frontend', 'backend', 'react']) },
        { name: 'Tailwind CSS', category: 'Frontend', description: 'A utility-first CSS framework packed with classes to build designs in your markup.', icon: '🎨', tags: JSON.stringify(['css', 'frontend', 'design']) },
        { name: 'Figma', category: 'Design', description: 'Collaborative web application for interface design, vector graphics editor and prototyping.', icon: '🖌️', tags: JSON.stringify(['design', 'ui', 'ux']) },
        { name: 'PostgreSQL', category: 'Database', description: 'Powerful, open source object-relational database system.', icon: '🐘', tags: JSON.stringify(['database', 'sql', 'data']) },
        { name: 'Java', category: 'Programming', description: 'Class-based, object-oriented programming language designed to have as few implementation dependencies as possible.', icon: '☕', tags: JSON.stringify(['backend', 'enterprise', 'programming']) },
        { name: 'C++', category: 'Programming', description: 'General-purpose programming language created as an extension of the C programming language.', icon: '⚡', tags: JSON.stringify(['systems', 'performance', 'gaming']) },
        { name: 'Vue.js', category: 'Frontend', description: 'The Progressive JavaScript Framework for building user interfaces.', icon: '🟢', tags: JSON.stringify(['frontend', 'ui', 'javascript']) },
        { name: 'Angular', category: 'Frontend', description: 'Platform for building mobile and desktop web applications.', icon: '🅰️', tags: JSON.stringify(['frontend', 'ui', 'typescript']) },
        { name: 'Redis', category: 'Database', description: 'In-memory data structure store, used as a distributed, in-memory key–value database, cache and message broker.', icon: '🔴', tags: JSON.stringify(['database', 'cache', 'data']) },
        { name: 'Firebase', category: 'Cloud', description: 'Platform developed by Google for creating mobile and web applications.', icon: '🔥', tags: JSON.stringify(['cloud', 'backend', 'auth']) },
        { name: 'PHP', category: 'Backend', description: 'Popular general-purpose scripting language that is especially suited to web development.', icon: '🐘', tags: JSON.stringify(['backend', 'web', 'programming']) },
        { name: 'C#', category: 'Programming', description: 'Modern, object-oriented, and type-safe programming language developed by Microsoft.', icon: '🎯', tags: JSON.stringify(['backend', 'enterprise', 'gaming']) },
        { name: 'Kotlin', category: 'Mobile', description: 'Cross-platform, statically typed, general-purpose programming language with type inference.', icon: '🟣', tags: JSON.stringify(['mobile', 'android', 'backend']) },
        { name: 'Swift', category: 'Mobile', description: 'Powerful and intuitive programming language for iOS, iPadOS, macOS, tvOS, and watchOS.', icon: '🦅', tags: JSON.stringify(['mobile', 'ios', 'apple']) },
    ];

    try {
        const extraSkills = require('./skills100.js');
        skillsData.push(...extraSkills);
        const extraSkills50 = require('./skills50.js');
        skillsData.push(...extraSkills50);
    } catch (e) {
        console.log('Skipping extra skills');
    }

    const skills = [];
    for (const sd of skillsData) {
        const skill = await prisma.skill.upsert({
            where: { name: sd.name },
            update: {},
            create: sd,
        });
        skills.push(skill);
        console.log(`  ✅ Skill: ${skill.name}`);
    }

    const jsSkill = skills.find(s => s.name === 'JavaScript');
    const reactSkill = skills.find(s => s.name === 'React');

    const jsQuestions = [
        { id: 1, text: 'What is the output of `typeof null`?', options: ['null', 'object', 'undefined', 'string'], correctAnswer: 'object', points: 1 },
        { id: 2, text: 'Which method adds an element to the end of an array?', options: ['push()', 'pop()', 'shift()', 'unshift()'], correctAnswer: 'push()', points: 1 },
        { id: 3, text: 'What does `===` mean in JavaScript?', options: ['Assignment', 'Loose equality', 'Strict equality', 'Not equal'], correctAnswer: 'Strict equality', points: 1 },
        { id: 4, text: 'Which keyword declares a block-scoped variable?', options: ['var', 'let', 'function', 'global'], correctAnswer: 'let', points: 1 },
        { id: 5, text: 'What is a Promise in JavaScript?', options: ['A loop construct', 'An object representing eventual completion of async op', 'A variable type', 'A DOM element'], correctAnswer: 'An object representing eventual completion of async op', points: 1 },
        { id: 6, text: 'What does `Array.prototype.map()` return?', options: ['undefined', 'A filtered array', 'A new array with results of calling a function', 'The original modified array'], correctAnswer: 'A new array with results of calling a function', points: 1 },
        { id: 7, text: 'How do you prevent default browser behavior in an event handler?', options: ['event.stop()', 'event.preventDefault()', 'event.halt()', 'event.cancel()'], correctAnswer: 'event.preventDefault()', points: 1 },
        { id: 8, text: 'What is a closure in JavaScript?', options: ['Closing browser tabs', 'A function with access to outer function scope', 'A CSS property', 'An error type'], correctAnswer: 'A function with access to outer function scope', points: 1 },
        { id: 9, text: 'What is the purpose of async/await?', options: ['Run code in parallel only', 'Write async code in a synchronous-like style', 'Stop code execution', 'Create loops'], correctAnswer: 'Write async code in a synchronous-like style', points: 1 },
        { id: 10, text: 'Which method creates a shallow copy of an array?', options: ['Array.copy()', 'arr.slice()', 'arr.splice()', 'arr.clone()'], correctAnswer: 'arr.slice()', points: 1 },
    ];

    const reactQuestions = [
        { id: 1, text: 'What is JSX?', options: ['A CSS framework', 'A JavaScript syntax extension for HTML-like code', 'A database query language', 'A testing library'], correctAnswer: 'A JavaScript syntax extension for HTML-like code', points: 1 },
        { id: 2, text: 'Which hook is used for side effects in React?', options: ['useState', 'useEffect', 'useContext', 'useReducer'], correctAnswer: 'useEffect', points: 1 },
        { id: 3, text: 'What is the Virtual DOM?', options: ['A real browser DOM', 'An in-memory representation of the real DOM', 'A database', 'A CSS concept'], correctAnswer: 'An in-memory representation of the real DOM', points: 1 },
        { id: 4, text: 'How do you pass data from parent to child?', options: ['Using state', 'Using props', 'Using context only', 'Using Redux only'], correctAnswer: 'Using props', points: 1 },
        { id: 5, text: 'Which hook manages local component state?', options: ['useEffect', 'useState', 'useMemo', 'useRef'], correctAnswer: 'useState', points: 1 },
        { id: 6, text: 'What is the key prop used for in lists?', options: ['Styling', 'Helping React identify changed elements', 'Making items clickable', 'Sorting'], correctAnswer: 'Helping React identify changed elements', points: 1 },
        { id: 7, text: 'What does useContext do?', options: ['Manages routing', 'Passes data without prop drilling', 'Handles API calls', 'Manages animations'], correctAnswer: 'Passes data without prop drilling', points: 1 },
        { id: 8, text: 'What is a controlled component?', options: ['No props', 'Form data controlled by React state', 'No hooks', 'Server component'], correctAnswer: 'Form data controlled by React state', points: 1 },
        { id: 9, text: 'When does useEffect with [] run?', options: ['On every render', 'Only on initial mount', 'On unmount only', 'Never'], correctAnswer: 'Only on initial mount', points: 1 },
        { id: 10, text: 'What is React.memo used for?', options: ['Memory management', 'Prevent unnecessary re-renders', 'Caching API responses', 'Creating memoized functions'], correctAnswer: 'Prevent unnecessary re-renders', points: 1 },
    ];

    await prisma.skillTest.upsert({
        where: { id: 'test-javascript-001' },
        update: {},
        create: {
            id: 'test-javascript-001',
            skillId: jsSkill.id,
            title: 'JavaScript Fundamentals Assessment',
            description: 'Test covering JS core concepts, ES6+, and async programming.',
            difficultyLevel: 'intermediate',
            timeLimit: 30,
            passingScore: 70,
            questions: JSON.stringify(jsQuestions),
        },
    });
    console.log('  ✅ Test: JavaScript');

    await prisma.skillTest.upsert({
        where: { id: 'test-react-001' },
        update: {},
        create: {
            id: 'test-react-001',
            skillId: reactSkill.id,
            title: 'React Development Assessment',
            description: 'Test covering React fundamentals, hooks, and component patterns.',
            difficultyLevel: 'intermediate',
            timeLimit: 30,
            passingScore: 70,
            questions: JSON.stringify(reactQuestions),
        },
    });
    console.log('  ✅ Test: React');

    const hashedPass = await bcrypt.hash('Test1234!', 12);

    const student = await prisma.user.upsert({
        where: { email: 'student@skillpassport.dev' },
        update: {},
        create: {
            name: 'Alex Johnson',
            email: 'student@skillpassport.dev',
            password: hashedPass,
            role: 'STUDENT',
            username: 'alexjohnson',
            headline: 'Full-Stack Developer in Progress',
            bio: 'Passionate developer learning and building cool things every day.',
            location: 'San Francisco, CA',
            githubUrl: 'https://github.com/alexjohnson',
        },
    });

    const reviewer = await prisma.user.upsert({
        where: { email: 'reviewer@skillpassport.dev' },
        update: {},
        create: {
            name: 'Dr. Sarah Kim',
            email: 'reviewer@skillpassport.dev',
            password: hashedPass,
            role: 'REVIEWER',
            username: 'sarahkim',
            headline: 'Senior Software Engineer & Tech Reviewer',
            bio: 'Ex-Google engineer, passionate about mentoring developers.',
        },
    });

    await prisma.reviewerProfile.upsert({
        where: { userId: reviewer.id },
        update: {},
        create: {
            userId: reviewer.id,
            expertiseDomains: JSON.stringify(['JavaScript', 'React', 'System Design']),
            credibilityRating: 5.0,
        },
    });

    const recruiter = await prisma.user.upsert({
        where: { email: 'recruiter@skillpassport.dev' },
        update: {},
        create: {
            name: 'James Wilson',
            email: 'recruiter@skillpassport.dev',
            password: hashedPass,
            role: 'RECRUITER',
            username: 'jameswilson',
            headline: 'Tech Talent Acquisition at StartupCo',
        },
    });

    await prisma.recruiterAccess.upsert({
        where: { recruiterId: recruiter.id },
        update: {},
        create: {
            recruiterId: recruiter.id,
            companyName: 'StartupCo',
            subscriptionPlan: 'PRO',
            accessLevel: 3,
        },
    });

    await prisma.user.upsert({
        where: { email: 'admin@skillpassport.dev' },
        update: {},
        create: {
            name: 'Platform Admin',
            email: 'admin@skillpassport.dev',
            password: hashedPass,
            role: 'SUPER_ADMIN',
            username: 'platformadmin',
        },
    });

    console.log('\n🎉 Seed complete!');
    console.log('\n📋 Demo Accounts (all password: Test1234!):');
    console.log('  👨‍🎓 Student:   student@skillpassport.dev');
    console.log('  🔍 Reviewer:  reviewer@skillpassport.dev');
    console.log('  💼 Recruiter: recruiter@skillpassport.dev');
    console.log('  ⚙️  Admin:     admin@skillpassport.dev');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
