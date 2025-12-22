
import { InventoryItem, Entity, BlockType } from '../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';

export interface WorldSave {
  id: string;
  name: string;
  seed: number;
  created: number;
  lastPlayed: number;
  worldData: string; // Base64 encoded Uint8Array
  wallsData: string; // Base64 encoded Uint8Array (Added)
  player: {
    x: number;
    y: number;
    health: number;
    inventory: (InventoryItem | null)[];
    spawnPoint: { x: number, y: number };
    color: string;
    hairColor: string;
    skinColor: string;
  };
  time: number;
}

export interface SaveSummary {
    id: string;
    name: string;
    lastPlayed: number;
    seed: number;
}

const encodeArray = (arr: Uint8Array): string => {
    let binary = '';
    const len = arr.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(arr[i]);
    }
    return btoa(binary);
};

export const decodeWorldData = (b64: string): Uint8Array => {
    if (!b64) return new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

export const saveWorld = (
    id: string, 
    name: string, 
    world: Uint8Array, 
    walls: Uint8Array,
    player: Entity, 
    inventory: (InventoryItem | null)[], 
    time: number, 
    seed: number
) => {
    const save: WorldSave = {
        id,
        name,
        seed,
        created: Date.now(), 
        lastPlayed: Date.now(),
        worldData: encodeArray(world),
        wallsData: encodeArray(walls),
        player: {
            x: player.x,
            y: player.y,
            health: player.health,
            inventory,
            spawnPoint: { x: 0, y: 0 },
            color: player.color || '#3b82f6',
            hairColor: player.hairColor || '#422006',
            skinColor: player.skinColor || '#ffdbac'
        },
        time
    };
    
    // Preserve creation time if updating
    const existing = localStorage.getItem(`terrarium_save_${id}`);
    if (existing) {
        try {
            const parsed = JSON.parse(existing);
            save.created = parsed.created || Date.now();
        } catch (e) {}
    }

    localStorage.setItem(`terrarium_save_${id}`, JSON.stringify(save));
    updateSaveList(id, name, save.lastPlayed, seed);
};

const updateSaveList = (id: string, name: string, lastPlayed: number, seed: number) => {
    const listStr = localStorage.getItem('terrarium_saves_list');
    let list: SaveSummary[] = listStr ? JSON.parse(listStr) : [];
    
    const idx = list.findIndex(x => x.id === id);
    if (idx >= 0) {
        list[idx] = { id, name, lastPlayed, seed };
    } else {
        list.push({ id, name, lastPlayed, seed });
    }
    // Sort by newest first
    list.sort((a, b) => b.lastPlayed - a.lastPlayed);
    localStorage.setItem('terrarium_saves_list', JSON.stringify(list));
}

export const loadWorld = (id: string): WorldSave | null => {
    const str = localStorage.getItem(`terrarium_save_${id}`);
    if (!str) return null;
    try {
        const save = JSON.parse(str);
        // Fallback for old saves without walls
        if (!save.wallsData) {
            save.wallsData = encodeArray(new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT));
        }
        return save;
    } catch (e) {
        console.error("Failed to parse save", e);
        return null;
    }
}

export const getSaveList = (): SaveSummary[] => {
    const listStr = localStorage.getItem('terrarium_saves_list');
    return listStr ? JSON.parse(listStr) : [];
}

export const deleteWorld = (id: string) => {
    localStorage.removeItem(`terrarium_save_${id}`);
    const listStr = localStorage.getItem('terrarium_saves_list');
    if (listStr) {
        let list: SaveSummary[] = JSON.parse(listStr);
        list = list.filter(x => x.id !== id);
        localStorage.setItem('terrarium_saves_list', JSON.stringify(list));
    }
}
