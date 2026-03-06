#!/usr/bin/env node
import { createInterface } from 'readline';
import { initORM } from '../db.js';
import { User } from '../entities/user.entity.js';
import { Role } from '../entities/role.entity.js';
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
    console.log('\nFastify Admin — Create Admin User');
    console.log('─'.repeat(34) + '\n');

    const { orm } = await initORM();
    const em = orm.em.fork();

    let email: string;
    while (true) {
        email = await ask('Email:     ');
        if (!email || !email.includes('@')) { console.log('  Please enter a valid email address.'); continue; }
        if (await em.findOne(User, { email })) { console.log('  Email is already taken.'); continue; }
        break;
    }

    let username: string;
    while (true) {
        username = await ask('Username:  ');
        if (!username || username.length < 2) { console.log('  Username must be at least 2 characters.'); continue; }
        if (await em.findOne(User, { username })) { console.log('  Username is already taken.'); continue; }
        break;
    }

    let fullName: string;
    while (true) {
        fullName = await ask('Full name: ');
        if (fullName) break;
        console.log('  Full name cannot be empty.');
    }

    let password: string;
    while (true) {
        password = await askHidden('Password:  ');
        if (password.length >= 8) break;
        console.log('  Password must be at least 8 characters.');
    }

    rl.close();
    console.log('\nCreating user…');

    const user = em.create(User, { fullName, username, email, password: await hashPassword(password) });
    await em.persistAndFlush(user);

    const adminRole = await em.findOne(Role, { name: 'Admin' }, { populate: ['users'] });
    if (!adminRole) {
        console.warn('\nWarning: "Admin" role not found. Start the server once to seed roles, then re-run.');
    } else {
        adminRole.users.add(user);
        await em.flush();
    }

    await orm.close();
    console.log(`\n✓ User "${fullName}" <${email}> created${adminRole ? ' with Admin role' : ''}.`);
}

main().catch((err) => {
    console.error('\nUnexpected error:', err.message ?? err);
    process.exit(1);
});
