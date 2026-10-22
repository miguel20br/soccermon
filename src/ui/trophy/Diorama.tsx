import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HudIcon } from '../components/MatchHud';
import type { Metal } from '../rarity';
import { reduceMotionOn } from '../settings-sync';

/**
 * Sala de troféus em diorama 3D (protótipo pro `?lab=sala`, docs/planos/menus-e-sala.md): o quarto visto de cima em
 * ângulo, à noite, com holofote em cada vitrine, troféus de metal que refletem, móveis low-poly do KayKit Furniture
 * Bits (CC0, public/assets/room/kaykit) e o seu Pokémon andando até o que você toca. Tocar num troféu: a câmera chega
 * perto, ele gira (como a galeria de troféus do Smash) e o cartão com as informações aparece do lado.
 */

export interface DioramaItem {
    id: string;
    kind: 'taca' | 'medalhao' | 'cinturao' | 'liga';
    metal: Metal;
    n: number;
    name: string;
    lines: string[];
}

export interface DioramaData {
    club: number;
    items: DioramaItem[];
    /** Sprite do seu Pokémon (o do avatar). */
    mon: string;
}

const METAL_COLOR: Record<Metal, number> = { bronze: 0xc0763c, prata: 0xd8dde6, ouro: 0xf2c440 };

/** Taça: perfil girado (LatheGeometry) + duas alças. */
function cup(metal: Metal, scale = 1, ghost = false) {
    const mat = ghost
        ? new THREE.MeshStandardMaterial({ color: 0x6a74a8, transparent: true, opacity: 0.55, roughness: 0.6 })
        : new THREE.MeshStandardMaterial({ color: METAL_COLOR[metal], metalness: 1, roughness: 0.22 });
    const pts = [
        [0, 0],
        [0.2, 0],
        [0.2, 0.05],
        [0.09, 0.09],
        [0.05, 0.22],
        [0.08, 0.3],
        [0.22, 0.4],
        [0.27, 0.6],
        [0.25, 0.62],
        [0.2, 0.46],
        [0, 0.4],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), mat);
    body.castShadow = true;
    g.add(body);
    for (const side of [-1, 1]) {
        const h = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 10, 24, Math.PI * 1.2), mat);
        h.position.set(side * 0.27, 0.48, 0);
        h.rotation.z = side > 0 ? -Math.PI * 0.6 : Math.PI * 1.6;
        h.castShadow = true;
        g.add(h);
    }
    g.scale.setScalar(scale);
    return g;
}

/** Medalhão com fita (Copa do Dia). */
function medal(metal: Metal, ghost: boolean, ribbon: number) {
    const g = new THREE.Group();
    const mat = ghost
        ? new THREE.MeshStandardMaterial({ color: 0x6a74a8, transparent: true, opacity: 0.55 })
        : new THREE.MeshStandardMaterial({ color: METAL_COLOR[metal], metalness: 1, roughness: 0.25 });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 32), mat);
    disc.rotation.x = Math.PI / 2;
    disc.position.y = 0.24;
    disc.castShadow = true;
    g.add(disc);
    const rib = new THREE.MeshStandardMaterial({ color: ribbon, roughness: 0.7 });
    for (const side of [-1, 1]) {
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.32, 0.01), rib);
        r.position.set(side * 0.07, 0.52, -0.01);
        r.rotation.z = side * 0.35;
        g.add(r);
    }
    // de frente pra câmera (que olha do canto da frente, em 45°)
    g.rotation.y = Math.PI / 4;
    return g;
}

/** Cinturão (Duelo): faixa de couro e a placa de metal no meio. */
function belt(metal: Metal, ghost: boolean) {
    const g = new THREE.Group();
    const leather = new THREE.MeshStandardMaterial({
        color: ghost ? 0x3a4270 : 0x3a2418,
        transparent: ghost,
        opacity: ghost ? 0.35 : 1,
        roughness: 0.8,
    });
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 0.04), leather);
    g.add(strap);
    const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.05, 24),
        ghost ? leather : new THREE.MeshStandardMaterial({ color: METAL_COLOR[metal], metalness: 1, roughness: 0.25 }),
    );
    plate.rotation.x = Math.PI / 2;
    plate.position.z = 0.02;
    g.add(plate);
    return g;
}

/** Tábuas do piso (textura desenhada num canvas). */
function floorTexture() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const x = c.getContext('2d')!;
    for (let i = 0; i < 8; i++) {
        x.fillStyle = i % 2 ? '#8a5a38' : '#94623e';
        x.fillRect(0, i * 32, 256, 32);
        x.fillStyle = '#6e4628';
        x.fillRect(0, i * 32 + 31, 256, 1);
        x.fillRect(((i * 97) % 256) | 0, i * 32, 2, 32);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 1.5);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

const W = 8;
const D = 6;
const H = 3.2;

export function Diorama({ data }: { data: DioramaData }) {
    const host = useRef<HTMLDivElement>(null);
    const monRef = useRef<HTMLImageElement>(null);
    const labels = useRef<Map<string, HTMLElement>>(new Map());
    const [sel, setSel] = useState<DioramaItem | null>(null);
    const api = useRef<{ select(id: string | null): void } | null>(null);

    useEffect(() => {
        const el = host.current;
        if (!el) return;
        const calm = reduceMotionOn();
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        el.prepend(renderer.domElement);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0e1430);
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environmentIntensity = 0.45;

        // ---- câmera ortográfica em ângulo (isométrico), olhando pro canto do fundo
        const view = 8.4;
        const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
        const home = { target: new THREE.Vector3(0, 0.7, 0.2), zoom: 1 };
        const look = { target: home.target.clone(), zoom: 1 };
        const goal = { target: home.target.clone(), zoom: 1 };
        const offset = new THREE.Vector3(9, 8, 9);
        const place = () => {
            cam.position.copy(look.target).add(offset);
            cam.zoom = look.zoom;
            cam.lookAt(look.target);
            cam.updateProjectionMatrix();
        };
        const resize = () => {
            const w = el.clientWidth;
            const h = el.clientHeight;
            renderer.setSize(w, h, false);
            const a = w / h;
            // o quarto inteiro cabe na largura (celular em pé) e na altura (tela larga)
            const v = Math.max(view, 10 / a);
            cam.left = (-v * a) / 2;
            cam.right = (v * a) / 2;
            cam.top = v / 2;
            cam.bottom = -v / 2;
            place();
        };

        // ---- quarto: piso de tábua, duas paredes azul-noite com rodapé e uma janela de noite
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(W, D),
            new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.85 }),
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x2b3566, roughness: 0.9 });
        const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.12), wallMat);
        back.position.set(0, H / 2, -D / 2 - 0.06);
        back.receiveShadow = true;
        scene.add(back);
        const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, H, D), wallMat);
        left.position.set(-W / 2 - 0.06, H / 2, 0);
        left.receiveShadow = true;
        scene.add(left);
        const trim = new THREE.MeshStandardMaterial({ color: 0x1b2350, roughness: 0.7 });
        const wain = new THREE.Mesh(new THREE.BoxGeometry(W, 0.9, 0.04), trim);
        wain.position.set(0, 0.45, -D / 2 + 0.01);
        scene.add(wain);
        const wainL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.9, D), trim);
        wainL.position.set(-W / 2 + 0.01, 0.45, 0);
        scene.add(wainL);
        const win = new THREE.Mesh(
            new THREE.PlaneGeometry(1.3, 1.1),
            new THREE.MeshStandardMaterial({ color: 0x1a2a5a, emissive: 0x3a5aa8, emissiveIntensity: 0.6 }),
        );
        win.position.set(-W / 2 + 0.02, 1.9, 1.6);
        win.rotation.y = Math.PI / 2;
        scene.add(win);

        // ---- luz: noite azulada + holofote quente em cada vitrine + o abajur
        scene.add(new THREE.HemisphereLight(0x8fa0ff, 0x2a1d12, 0.55));
        const moon = new THREE.DirectionalLight(0x9fb4ff, 0.5);
        moon.position.set(4, 8, 6);
        scene.add(moon);

        const picks: THREE.Object3D[] = [];
        const anchors = new Map<string, THREE.Vector3>();
        const spinners = new Map<string, THREE.Object3D>();
        const glass = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.05,
            transmission: 0.92,
            thickness: 0.05,
            transparent: true,
            opacity: 0.25,
        });
        const plinth = new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.5 });
        /** Vitrine: pedestal, caixa de vidro, holofote em cima e o troféu dentro. */
        const showcase = (item: DioramaItem, x: number, z: number, big = false) => {
            const g = new THREE.Group();
            g.position.set(x, 0, z);
            const ph = big ? 1.1 : 0.95;
            const pw = big ? 0.9 : 0.7;
            const base = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, pw), plinth);
            base.position.y = ph / 2;
            base.castShadow = base.receiveShadow = true;
            g.add(base);
            const box = new THREE.Mesh(new THREE.BoxGeometry(pw * 0.92, big ? 1.1 : 0.85, pw * 0.92), glass);
            box.position.y = ph + (big ? 0.55 : 0.425);
            g.add(box);
            const ghost = item.n === 0;
            const art =
                item.kind === 'medalhao'
                    ? medal(item.metal, ghost, data.club)
                    : item.kind === 'cinturao'
                      ? belt(item.metal, ghost)
                      : cup(item.metal, big ? 1.45 : 1, ghost || item.kind === 'liga');
            art.position.y = ph + (item.kind === 'cinturao' ? 0.35 : 0.02);
            g.add(art);
            art.userData.base = art.rotation.y;
            spinners.set(item.id, art);
            if (!ghost) {
                const spot = new THREE.SpotLight(0xffe7b0, 9, 5, 0.42, 0.7, 1.4);
                spot.position.set(x, H - 0.1, z + 0.4);
                spot.target = art;
                spot.castShadow = true;
                spot.shadow.mapSize.set(512, 512);
                scene.add(spot);
            }
            g.userData.pick = item.id;
            picks.push(g);
            anchors.set(item.id, new THREE.Vector3(x, ph + (big ? 1.3 : 1.05), z));
            scene.add(g);
        };
        const by = (kind: DioramaItem['kind']) => data.items.filter((i) => i.kind === kind);
        by('taca').forEach((it, i) => {
            showcase(it, -2.7 + i * 1.15, -D / 2 + 0.6);
        });
        const liga = by('liga')[0];
        if (liga) showcase(liga, 1.25, -D / 2 + 0.7, true);
        by('medalhao').forEach((it, i) => {
            showcase(it, -W / 2 + 0.6, -1.3 + i * 1.0);
        });
        // cinturões pendurados na parede do fundo, em cima das taças
        by('cinturao').forEach((it, i) => {
            const b = belt(it.metal, it.n === 0);
            b.position.set(-2.7 + i * 1.15, 2.55, -D / 2 + 0.05);
            b.userData.pick = it.id;
            picks.push(b);
            anchors.set(it.id, new THREE.Vector3(-2.7 + i * 1.15, 2.75, -D / 2 + 0.1));
            scene.add(b);
        });

        // ---- móveis (KayKit, CC0)
        const loader = new GLTFLoader();
        const put = (name: string, x: number, z: number, rotY = 0, s = 1, tint?: number) =>
            loader.load(`assets/room/kaykit/${name}.gltf`, (gl) => {
                const o = gl.scene;
                o.position.set(x, 0, z);
                o.rotation.y = rotY;
                o.scale.setScalar(s);
                o.traverse((m) => {
                    const mesh = m as THREE.Mesh;
                    if (!mesh.isMesh) return;
                    mesh.castShadow = mesh.receiveShadow = true;
                    if (tint !== undefined) {
                        mesh.material = (mesh.material as THREE.MeshStandardMaterial).clone();
                        (mesh.material as THREE.MeshStandardMaterial).color = new THREE.Color(tint);
                    }
                });
                scene.add(o);
            });
        put('rug_rectangle_stripes_A', 0.4, 1.0, 0, 1.4);
        put('shelf_B_large_decorated', 3.3, -D / 2 + 0.35, 0, 1);
        put('armchair_pillows', -1.6, 2.2, Math.PI * 0.8, 1);
        put('lamp_standing', -2.6, 2.6, 0, 1);
        put('cactus_medium_A', 3.4, 2.4, 0, 1);
        put('table_low', 2.4, 1.6, -Math.PI / 2, 1);
        put('pictureframe_large_A', -W / 2 + 0.02, 1.9, -0.2, 1);
        // TV (passa o último título): caixa escura com a tela acesa
        const tv = new THREE.Group();
        const tvBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.9, 0.6, 0.12),
            new THREE.MeshStandardMaterial({ color: 0x23242c, roughness: 0.4 }),
        );
        tvBody.castShadow = true;
        tv.add(tvBody);
        const screen = new THREE.Mesh(
            new THREE.PlaneGeometry(0.8, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x5aa0ff, emissive: 0x3a7bd5, emissiveIntensity: 0.9 }),
        );
        screen.position.z = 0.061;
        tv.add(screen);
        tv.position.set(2.4, 0.75, 1.6);
        tv.rotation.y = Math.PI / 4;
        scene.add(tv);
        const lamp = new THREE.PointLight(0xffc98a, 6, 4, 1.6);
        lamp.position.set(-2.6, 1.7, 2.6);
        scene.add(lamp);

        // ---- tocar: escolhe o troféu (a câmera chega perto, ele gira); fora dele, volta
        const ray = new THREE.Raycaster();
        const ndc = new THREE.Vector2();
        let selected: string | null = null;
        const select = (id: string | null) => {
            selected = id;
            setSel(id ? (data.items.find((i) => i.id === id) ?? null) : null);
            const a = id ? anchors.get(id) : null;
            goal.target.copy(a ? a.clone().add(new THREE.Vector3(0, -0.3, 0)) : home.target);
            goal.zoom = a ? 2.2 : 1;
            if (calm) {
                look.target.copy(goal.target);
                look.zoom = goal.zoom;
            }
        };
        api.current = { select };
        const onDown = (e: PointerEvent) => {
            const r = renderer.domElement.getBoundingClientRect();
            ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
            ray.setFromCamera(ndc, cam);
            const hit = ray.intersectObjects(picks, true)[0];
            let o: THREE.Object3D | null = hit?.object ?? null;
            while (o && !o.userData.pick) o = o.parent;
            select(o ? (o.userData.pick as string) : null);
        };
        renderer.domElement.addEventListener('pointerdown', onDown);

        // ---- laço: câmera desliza, troféu escolhido gira, o Pokémon anda até ele, as plaquinhas acompanham
        const mon = new THREE.Vector3(0.4, 0, 1.2);
        const monGoal = mon.clone();
        const tmp = new THREE.Vector3();
        let raf = 0;
        let last = performance.now();
        const loop = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            const k = calm ? 1 : 1 - (1 - 0.12) ** (dt * 60);
            look.target.lerp(goal.target, k);
            look.zoom += (goal.zoom - look.zoom) * k;
            place();
            for (const [id, o] of spinners) {
                const base = (o.userData.base as number) ?? 0;
                if (calm) o.rotation.y = base;
                else if (id === selected) o.rotation.y += dt * 1.2;
                else o.rotation.y = base + (o.rotation.y - base) * 0.9;
            }
            const a = selected ? anchors.get(selected) : null;
            monGoal.set(a ? a.x + 0.2 : 0.4, 0, a ? Math.min(D / 2 - 0.4, a.z + 0.9) : 1.2);
            mon.lerp(monGoal, calm ? 1 : Math.min(1, dt * 1.6));
            const rect = renderer.domElement.getBoundingClientRect();
            const toScreen = (v: THREE.Vector3) => {
                tmp.copy(v).project(cam);
                return [((tmp.x + 1) / 2) * rect.width, ((1 - tmp.y) / 2) * rect.height];
            };
            if (monRef.current) {
                const [x, y] = toScreen(mon);
                monRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%) scale(${0.6 + look.zoom * 0.4})`;
                monRef.current.classList.toggle('flip', monGoal.x > mon.x + 0.02);
            }
            for (const [id, node] of labels.current) {
                const v = anchors.get(id);
                if (!v) continue;
                const [x, y] = toScreen(v);
                node.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
            }
            renderer.render(scene, cam);
            raf = requestAnimationFrame(loop);
        };
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        resize();
        raf = requestAnimationFrame(loop);
        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            renderer.domElement.removeEventListener('pointerdown', onDown);
            renderer.dispose();
            pmrem.dispose();
            renderer.domElement.remove();
        };
    }, [data]);

    return (
        <div className="diorama" ref={host}>
            <img ref={monRef} className="diorama-mon pixel" src={data.mon} alt="" />
            {data.items
                .filter((i) => i.n > 1)
                .map((i) => (
                    <b
                        key={i.id}
                        className="diorama-n"
                        ref={(n) => {
                            if (n) labels.current.set(i.id, n);
                            else labels.current.delete(i.id);
                        }}
                    >
                        ×{i.n}
                    </b>
                ))}
            {sel && (
                <aside className="diorama-card" data-exit>
                    <button
                        type="button"
                        className="diorama-x"
                        onClick={() => api.current?.select(null)}
                        aria-label="Fechar"
                    >
                        <HudIcon kind="close" />
                    </button>
                    <span className={`diorama-metal m-${sel.metal}`}>{sel.n ? `×${sel.n}` : 'Falta ganhar'}</span>
                    <b>{sel.name}</b>
                    {sel.lines.map((l) => (
                        <small key={l}>{l}</small>
                    ))}
                </aside>
            )}
        </div>
    );
}
