const { z } = require('zod');

const registerSchema = z.object({
  pseudo: z
    .string({ required_error: 'Le pseudo est requis' })
    .min(3, 'Le pseudo doit contenir au moins 3 caractères')
    .max(50, 'Le pseudo ne peut pas dépasser 50 caractères'),
  email: z
    .string({ required_error: 'L\'email est requis' })
    .email('Adresse email invalide'),
  mot_de_passe: z
    .string({ required_error: 'Le mot de passe est requis' })
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'L\'email est requis' })
    .email('Adresse email invalide'),
  mot_de_passe: z
    .string({ required_error: 'Le mot de passe est requis' }),
});

module.exports = { registerSchema, loginSchema };
