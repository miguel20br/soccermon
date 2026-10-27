// Postar nas redes pelo Buffer (API GraphQL; skill soccermon-social). A chave fica em BUFFER_API_KEY no .env.local.
//   node scripts/buffer.mjs canais                       lista as redes ligadas (id, serviço, nome)
//   node scripts/buffer.mjs tipo <Tipo>                  campos de um tipo da API (ex.: PostInputMetaData)
//   node scripts/buffer.mjs postar <canal> <url do vídeo> <arquivo da legenda> <quando ISO | fila | agora> [metadata JSON]
// CAPA_MS=30000: o quadro da capa (ms do vídeo) no Instagram e no TikTok.
// O vídeo tem que estar num link público e estável até a hora do post (o Buffer baixa de lá).
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const KEY = env.match(/^BUFFER_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error('falta BUFFER_API_KEY no .env.local');

async function gql(query, variables = {}) {
    const r = await fetch('https://api.buffer.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ query, variables }),
    });
    const j = await r.json();
    if (j.errors) throw new Error(JSON.stringify(j.errors, null, 1));
    return j.data;
}

const [cmd, ...a] = process.argv.slice(2);
if (cmd === 'canais') {
    const { account } = await gql('{ account { organizations { id name } } }');
    for (const org of account.organizations) {
        const { channels } = await gql(
            'query($o: OrganizationId!) { channels(input: { organizationId: $o }) { id service name displayName isQueuePaused } }',
            {
                o: org.id,
            },
        );
        for (const c of channels)
            console.log(
                `${c.id}  ${c.service}  ${c.displayName ?? c.name}${c.isQueuePaused ? '  (fila pausada)' : ''}`,
            );
    }
} else if (cmd === 'tipo') {
    const { __type: t } = await gql(
        'query($n: String!) { __type(name: $n) { name kind inputFields { name type { name kind ofType { name kind } } } fields { name } enumValues { name } } }',
        {
            n: a[0],
        },
    );
    console.log(JSON.stringify(t, null, 1));
} else if (cmd === 'postar') {
    const [canal, url, legenda, quando, meta] = a;
    const input = {
        text: readFileSync(legenda, 'utf8').trim(),
        channelId: canal,
        schedulingType: 'automatic',
        mode: quando === 'fila' ? 'addToQueue' : quando === 'agora' ? 'shareNow' : 'customScheduled',
        ...(quando === 'fila' || quando === 'agora' ? {} : { dueAt: new Date(quando).toISOString() }),
        assets: [
            {
                video: {
                    url,
                    ...(process.env.CAPA_MS ? { metadata: { thumbnailOffset: Number(process.env.CAPA_MS) } } : {}),
                },
            },
        ],
        ...(meta ? { metadata: JSON.parse(meta) } : {}),
    };
    const d = await gql(
        'mutation($i: CreatePostInput!) { createPost(input: $i) { ... on PostActionSuccess { post { id dueAt } } ... on MutationError { message } } }',
        { i: input },
    );
    console.log(JSON.stringify(d.createPost));
} else {
    console.log('uso: canais | tipo <Tipo> | postar <canal> <url> <legenda.txt> <quando|fila> [metadata]');
}
