import { User } from '../types';

export const emailService = {
  /**
   * Simulates sending a welcome email to the new user.
   * In a production environment, this would connect to an API like SendGrid, AWS SES, or EmailJS.
   */
  sendWelcomeEmail: async (user: User, password?: string): Promise<boolean> => {
    console.log(`%c[Email Service] Preparando envio para ${user.email}...`, 'color: #3b82f6; font-weight: bold;');

    // Content of the email
    const subject = "Bem-vindo(a) à Equipe Kethellem Store!";
    const body = `
-------------------------------------------------------
DE: Sistema Kethellem Store <noreply@kethellemstore.com>
PARA: ${user.name} <${user.email}>
ASSUNTO: ${subject}

Olá ${user.name},

Seja bem-vindo(a) à nossa equipe! Seu cadastro no sistema foi realizado com sucesso.

Abaixo estão suas credenciais de acesso inicial:
-------------------------------------------------------
LOGIN: ${user.email}
SENHA PROVISÓRIA: ${password}
-------------------------------------------------------

Recomendamos que você altere sua senha e atualize seu status no primeiro acesso através do menu "Editar Perfil".

Atenciosamente,
Gerência Kethellem Store
-------------------------------------------------------
    `;

    // Simulate network delay (1.5 seconds) to make it feel real
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Log the email to console so the developer/user can see what "happened"
    console.log(body);
    console.log(`%c[Email Service] E-mail enviado com sucesso!`, 'color: #22c55e; font-weight: bold;');

    return true;
  }
};