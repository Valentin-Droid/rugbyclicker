const { z } = require('zod');

const createPartieSchema = z.object({
  nom_club: z
    .string({ required_error: 'Le nom du club est requis' })
    .min(1, 'Le nom du club est requis')
    .max(100, 'Le nom du club ne peut pas dépasser 100 caractères'),
});

module.exports = { createPartieSchema };
