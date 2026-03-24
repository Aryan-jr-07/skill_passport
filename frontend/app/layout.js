import './globals.css';
import { AuthProvider } from '../lib/auth';
import { ThemeProvider } from '../lib/theme';

export const metadata = {
    title: 'Skill Passport – Verified Skill Identity',
    description: 'The lifelong, verified skill identity platform. Prove what you know through tests, real-world projects, and expert human review.',
    keywords: 'skill verification, portfolio, developer, hiring, verified skills',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <ThemeProvider>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
