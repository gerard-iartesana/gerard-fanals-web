const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uidilhuybmtuokunutgz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZGlsaHV5Ym10dW9rdW51dGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDU0NTAsImV4cCI6MjA5MTQyMTQ1MH0.ir9FnuHhW_1i4OslE_SNbOCIgLUEWakScP71WYqnfJM';
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.NEWSLETTER_FROM || 'newsletter@gerardfanals.online';
const FROM_NAME = process.env.NEWSLETTER_FROM_NAME || 'Gerard Fanals Newsletter';
const SITE_URL = 'https://www.gerardfanals.online';

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!RESEND_KEY) {
        return res.status(500).json({ error: 'RESEND_API_KEY not configured in Vercel environment' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    try {
        // 1. Get config & last sent time
        let lastSent = null;
        let configId = null;
        try {
            const { data: config } = await supabase.from('newsletter_config').select('*').limit(1).single();
            if (config) {
                lastSent = config.last_sent_at;
                configId = config.id;
            }
        } catch (e) {}

        // 2. Get articles - either specific IDs or all pending
        const { article_ids } = req.body || {};
        let articles;

        if (article_ids && article_ids.length > 0) {
            // Manual send: specific articles selected by user
            const { data, error: artError } = await supabase.from('articles')
                .select('id, title, tag, excerpt, image, slug, created_at')
                .in('id', article_ids)
                .eq('published', true)
                .order('created_at', { ascending: false });
            if (artError) throw artError;
            articles = data;
        } else {
            // Cron send: all pending since last send
            let query = supabase.from('articles')
                .select('id, title, tag, excerpt, image, slug, created_at')
                .eq('published', true)
                .order('created_at', { ascending: false });
            if (lastSent) {
                query = query.gt('created_at', lastSent);
            }
            const { data, error: artError } = await query;
            if (artError) throw artError;
            articles = data;
        }

        if (!articles || articles.length === 0) {
            return res.status(200).json({ success: false, error: 'No hay artículos pendientes de envío' });
        }

        // 3. Get subscribers (filtered by IDs if provided, otherwise all)
        const { subscriber_ids } = req.body || {};
        let subQuery = supabase.from('newsletter_subscribers').select('email, name');
        if (subscriber_ids && subscriber_ids.length > 0) {
            subQuery = subQuery.in('id', subscriber_ids);
        }
        const { data: subscribers, error: subError } = await subQuery;
        if (subError) throw subError;

        if (!subscribers || subscribers.length === 0) {
            return res.status(200).json({ success: false, error: 'No hay suscriptores seleccionados' });
        }

        // 4. Build email HTML
        const articlesHtml = articles.map(function(a) {
            return '<tr><td style="padding:16px 0;border-bottom:1px solid #eee">' +
                '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
                (a.image ? '<td width="80" style="padding-right:16px;vertical-align:top"><img src="' + a.image + '" width="80" height="60" style="border-radius:8px;object-fit:cover;display:block" alt=""></td>' : '') +
                '<td style="vertical-align:top">' +
                '<a href="' + SITE_URL + '/articulo.html?slug=' + (a.slug || a.id) + '" style="color:#1a1a2e;font-size:16px;font-weight:600;text-decoration:none;line-height:1.3">' + a.title + '</a>' +
                '<p style="color:#86868b;font-size:13px;margin:6px 0 0;line-height:1.4">' + (a.excerpt || '') + '</p>' +
                '<span style="display:inline-block;margin-top:6px;padding:2px 10px;background:#f0f0f5;border-radius:12px;font-size:11px;font-weight:600;color:#007AFF">' + (a.tag || 'General') + '</span>' +
                '</td></tr></table></td></tr>';
        }).join('');

        const dateStr = new Date().toLocaleDateString('es-ES', {day:'numeric',month:'long',year:'numeric'});
        const artWord = articles.length === 1 ? 'nuevo artículo' : 'nuevos artículos';

        const emailHtml = '<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;background:#f5f5f7">' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 20px"><tr><td align="center">' +
            '<table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05)">' +
            '<tr><td style="background:linear-gradient(135deg,#007AFF,#5856d6);padding:32px 40px;text-align:center">' +
            '<h1 style="color:white;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.02em">Gerard<span style="font-weight:400;opacity:0.8">Fanals</span></h1>' +
            '<p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">Newsletter semanal · ' + dateStr + '</p>' +
            '</td></tr>' +
            '<tr><td style="padding:32px 40px">' +
            '<h2 style="margin:0 0 8px;font-size:20px;color:#1a1a2e">Nuevos artículos esta semana</h2>' +
            '<p style="color:#86868b;font-size:14px;margin:0 0 24px;line-height:1.5">' + articles.length + ' ' + artWord + ' sobre IA, automatización y tecnología.</p>' +
            '<table width="100%" cellpadding="0" cellspacing="0">' + articlesHtml + '</table>' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px"><tr><td align="center">' +
            '<a href="' + SITE_URL + '/blog.html" style="display:inline-block;padding:14px 32px;background:#007AFF;color:white;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600">Ver todos los artículos →</a>' +
            '</td></tr></table></td></tr>' +
            '<tr><td style="padding:24px 40px;background:#f5f5f7;text-align:center;border-top:1px solid #e5e5e7">' +
            '<p style="color:#86868b;font-size:12px;margin:0;line-height:1.6">Recibes este email porque estás suscrito a la newsletter de Gerard Fanals.<br>' +
            '<a href="' + SITE_URL + '" style="color:#007AFF;text-decoration:none">gerardfanals.online</a></p>' +
            '</td></tr></table></td></tr></table></body></html>';

        // 5. Send emails via Resend (batch to avoid rate limits)
        const subject = '📰 ' + articles.length + ' ' + artWord + ' · Gerard Fanals Newsletter';
        
        for (const sub of subscribers) {
            try {
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + RESEND_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: FROM_NAME + ' <' + FROM_EMAIL + '>',
                        to: [sub.email],
                        subject: subject,
                        html: emailHtml
                    })
                });
            } catch (emailErr) {
                console.error('Error sending to ' + sub.email, emailErr);
            }
        }

        // 6. Log the send
        const now = new Date().toISOString();
        await supabase.from('newsletter_sends').insert({
            sent_at: now,
            articles_count: articles.length,
            subscribers_count: subscribers.length,
            article_ids: articles.map(function(a) { return a.id; })
        });

        // 7. Update last_sent_at in config
        if (configId) {
            await supabase.from('newsletter_config').update({ last_sent_at: now }).eq('id', configId);
        } else {
            await supabase.from('newsletter_config').insert({ send_day: 1, send_time: '10:00', last_sent_at: now });
        }

        return res.status(200).json({
            success: true,
            articlesCount: articles.length,
            subscribersCount: subscribers.length
        });

    } catch (error) {
        console.error('Newsletter send error:', error);
        return res.status(500).json({ error: error.message || 'Error interno' });
    }
};
