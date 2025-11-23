"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Alle Firmen abrufen
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { search, active } = req.query;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { contact_person: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (active !== undefined) {
            where.is_active = active === 'true';
        }
        const companies = await prisma.company.findMany({
            where,
            orderBy: { name: 'asc' }
        });
        res.json(companies);
    }
    catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Firmen' });
    }
});
// Einzelne Firma abrufen
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const company = await prisma.company.findUnique({
            where: { id: parseInt(id) }
        });
        if (!company) {
            return res.status(404).json({ error: 'Firma nicht gefunden' });
        }
        res.json(company);
    }
    catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Firma' });
    }
});
// Neue Firma erstellen
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { name, contact_person, email, phone, address, city, postal_code, country, tax_number, notes } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Firmenname ist erforderlich' });
        }
        const company = await prisma.company.create({
            data: {
                name,
                contact_person,
                email,
                phone,
                address,
                city,
                postal_code,
                country: country || 'Deutschland',
                tax_number,
                notes
            }
        });
        res.status(201).json(company);
    }
    catch (error) {
        console.error('Error creating company:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Eine Firma mit diesem Namen existiert bereits' });
        }
        res.status(500).json({ error: 'Fehler beim Erstellen der Firma' });
    }
});
// Firma aktualisieren
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contact_person, email, phone, address, city, postal_code, country, tax_number, notes, is_active } = req.body;
        const company = await prisma.company.update({
            where: { id: parseInt(id) },
            data: {
                name,
                contact_person,
                email,
                phone,
                address,
                city,
                postal_code,
                country,
                tax_number,
                notes,
                is_active
            }
        });
        res.json(company);
    }
    catch (error) {
        console.error('Error updating company:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Eine Firma mit diesem Namen existiert bereits' });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Firma nicht gefunden' });
        }
        res.status(500).json({ error: 'Fehler beim Aktualisieren der Firma' });
    }
});
// Firma löschen
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.company.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Firma erfolgreich gelöscht' });
    }
    catch (error) {
        console.error('Error deleting company:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Firma nicht gefunden' });
        }
        res.status(500).json({ error: 'Fehler beim Löschen der Firma' });
    }
});
exports.default = router;
//# sourceMappingURL=companies.js.map