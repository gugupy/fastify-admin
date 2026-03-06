#!/usr/bin/env node
import { createInterface } from 'readline';
import { initORM } from '../db.js';
import { User } from '../entities/user.entity.js';
import { hashPassword } from '../lib/password.js';

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });

function ask(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()));
    });
}

function askHidden(question: string): Promise<string> {
    return new Promise((resolve) => {
        let promptShown = false;
        (rl as any)._writeToOutput = (s: string) => {
            if (!promptShown) { process.stdout.write(s); promptShown = true; return; }
            if (s === '\r\n' || s === '\n' || s === '\r') process.stdout.write('\n');
        };
        rl.question(question, (answer) => {
            (rl as any)._writeToOutput = (s: string) => process.stdout.write(s);
            resolve(answer.trim());
        });
    });
}

async function main() {
    console.log('\nFastify Admin — Reset Password');
    console.log('─'.repeat(30) + '\n');

    let email: string;
    while (true) {
        email = await ask('Email:        ');
        if (email && email.includes('@')) break;
        console.log('  Please enter a valid email address.');
    }

    let newPassword: string;
    while (true) {
        newPassword = await askHidden('New password: ');
        if (newPassword.length < 8) { console.log('  Password must be at least 8 characters.'); continue; }
        const confirm = await askHidden('Confirm:      ');
        if (newPassword === confirm) break;
        console.log('  Passwords do not match, try again.');
    }

    rl.close();
    console.log('\nUpdating password…');

    const { orm } = await initORM();
    const em = orm.em.fork();

    const user = await em.findOne(User, { email });
    if (!user) {
        console.error(`\nError: no user found with email "${email}".`);
        await orm.close();
        process.exit(1);
    }

    user.password = await hashPassword(newPassword);
    await em.flush();
    await orm.close();

    console.log(`\n✓ Password updated for "${user.fullName}" <${email}>.`);
}

main().catch((err) => {
    console.error('\nUnexpected error:', err.message ?? err);
    process.exit(1);
});
