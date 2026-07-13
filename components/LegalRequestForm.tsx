'use client';

import {FormEvent, useState} from 'react';
import {legalRequestCategories, type LegalRequestCategory} from '@/lib/legal-request-categories';

export default function LegalRequestForm({
  defaultCategory = 'GENERAL',
  defaultSubject = '',
  pageUrl,
}: {
  defaultCategory?: LegalRequestCategory;
  defaultSubject?: string;
  pageUrl?: string;
}) {
  const [status, setStatus] = useState<{type: 'idle' | 'sending' | 'success' | 'error'; message?: string}>({type: 'idle'});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus({type: 'sending'});
    const response = await fetch('/api/legal-requests', {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        category: data.get('category'),
        requesterName: data.get('requesterName'),
        requesterEmail: data.get('requesterEmail'),
        subject: data.get('subject'),
        message: data.get('message'),
        pageUrl: pageUrl || data.get('pageUrl'),
        website: data.get('website'),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus({type: 'error', message: result.error || 'La demande n’a pas pu être enregistrée.'});
      return;
    }
    form.reset();
    setStatus({type: 'success', message: `Votre demande a été enregistrée. Référence : ${result.reference}.`});
  }

  return <form className="legal-request-form" onSubmit={submit}>
    <label>Catégorie
      <select name="category" defaultValue={defaultCategory} required>
        {Object.entries(legalRequestCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
    <div className="form-row">
      <label>Nom ou pseudo (facultatif)<input name="requesterName" maxLength={100} autoComplete="name"/></label>
      <label>Email de réponse<input name="requesterEmail" type="email" maxLength={254} autoComplete="email" required/></label>
    </div>
    <label>Objet<input name="subject" defaultValue={defaultSubject} minLength={3} maxLength={200} required/></label>
    {!pageUrl&&<label>URL concernée (facultatif)<input name="pageUrl" type="url" maxLength={500} placeholder="https://…"/></label>}
    <label>Votre demande<textarea name="message" minLength={20} maxLength={5000} rows={8} required/></label>
    <label className="honeypot" aria-hidden="true">Site web<input name="website" tabIndex={-1} autoComplete="off"/></label>
    <p className="form-help">Ces informations sont transmises à OFID et conservées uniquement pour traiter votre demande.</p>
    {status.type==='error'&&<p className="form-error" role="alert">{status.message}</p>}
    {status.type==='success'&&<p className="form-success" role="status">{status.message}</p>}
    <button className="btn" disabled={status.type==='sending'}>{status.type==='sending'?'Enregistrement…':'Envoyer la demande'}</button>
  </form>;
}
