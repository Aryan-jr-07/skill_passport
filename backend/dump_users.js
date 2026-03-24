const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function generateReport() {
    const users = await prisma.user.findMany({
        include: {
            userSkills: { include: { skill: true } },
            projects: true,
            testAttempts: { include: { test: true } },
            assignedReviews: true
        }
    });

    let output = "=====================================================\n";
    output += "             SKILL PASSPORT USER DATABASE            \n";
    output += "=====================================================\n\n";

    for (const user of users) {
        output += `👤 Name:     ${user.name}\n`;
        output += `✉️  Email:    ${user.email}\n`;
        output += `🔑 Password: ${user.password} (Hashed)\n`;
        output += `🎭 Role:     ${user.role}\n`;

        output += `\n  --- ACTIVITY ON WEBSITE ---\n`;

        if (user.userSkills.length > 0) {
            output += `  🎓 Skills Claimed/Verified:\n`;
            user.userSkills.forEach(us => {
                output += `     - ${us.skill.name} (Status: ${us.status}, Score: ${us.credibilityScore})\n`;
            });
        } else {
            output += `  🎓 No skills claimed yet.\n`;
        }

        if (user.testAttempts.length > 0) {
            output += `  📝 Tests Taken:\n`;
            user.testAttempts.forEach(ta => {
                output += `     - ${ta.test?.title || 'Unknown Test'} (Score: ${ta.score}%)\n`;
            });
        } else if (user.role === 'STUDENT') {
            output += `  📝 No tests taken yet.\n`;
        }

        if (user.projects.length > 0) {
            output += `  🛠️ Projects Submitted:\n`;
            user.projects.forEach(p => {
                output += `     - ${p.title} (URL: ${p.projectLink || p.repoLink || 'N/A'})\n`;
            });
        } else if (user.role === 'STUDENT') {
            output += `  🛠️ No projects submitted yet.\n`;
        }

        if (user.assignedReviews.length > 0) {
            output += `  🔍 Assigned Reviews (As Reviewer): ${user.assignedReviews.length}\n`;
        }

        output += "\n-----------------------------------------------------\n\n";
    }

    fs.writeFileSync('/tmp/user_report.txt', output);
}

generateReport()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
