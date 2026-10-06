import type { Equipment } from "./types.js";

export interface EquipmentRecipeNode {
  readonly equipment: Equipment;
  readonly components: readonly EquipmentRecipeNode[];
}

export interface EquipmentComponent {
  readonly equipment: Equipment;
  readonly quantity: number;
}

export interface EquipmentBuildPath {
  readonly equipment: Equipment;
  readonly path: readonly Equipment[];
}

function indexEquipment(equipments: readonly Equipment[]): ReadonlyMap<string, Equipment> {
  return new Map(equipments.map((equipment) => [equipment.equipmentId, equipment]));
}

export function getEquipmentRecipe(
  equipments: readonly Equipment[],
  equipmentId: string,
): readonly Equipment[] {
  const index = indexEquipment(equipments);
  const equipment = index.get(equipmentId);

  if (!equipment?.recipe) {
    return [];
  }

  return equipment.recipe.flatMap((componentId) => {
    const component = index.get(componentId);

    if (!component) {
      throw new Error(
        `Equipment "${equipmentId}" references unknown recipe component "${componentId}".`,
      );
    }

    return [component];
  });
}

export function getEquipmentRecipeTree(
  equipments: readonly Equipment[],
  equipmentId: string,
): EquipmentRecipeNode {
  const index = indexEquipment(equipments);
  const visiting = new Set<string>();

  function visit(id: string): EquipmentRecipeNode {
    const equipment = index.get(id);

    if (!equipment) {
      throw new Error(`Unknown equipment "${id}".`);
    }

    if (visiting.has(id)) {
      throw new Error(`Circular equipment recipe detected at "${id}".`);
    }

    visiting.add(id);

    const components = (equipment.recipe ?? []).map(visit);

    visiting.delete(id);

    return {
      equipment,
      components,
    };
  }

  return visit(equipmentId);
}

export function getBaseEquipmentComponents(
  equipments: readonly Equipment[],
  equipmentId: string,
): readonly EquipmentComponent[] {
  const index = indexEquipment(equipments);
  const quantities = new Map<string, number>();

  function visit(id: string): void {
    const equipment = index.get(id);

    if (!equipment) {
      throw new Error(`Unknown equipment "${id}".`);
    }

    if (!equipment.recipe || equipment.recipe.length === 0) {
      quantities.set(id, (quantities.get(id) ?? 0) + 1);
      return;
    }

    for (const componentId of equipment.recipe) {
      visit(componentId);
    }
  }

  visit(equipmentId);

  return [...quantities.entries()].map(([id, quantity]) => {
    const equipment = index.get(id);

    if (!equipment) {
      throw new Error(`Unknown equipment "${id}".`);
    }

    return {
      equipment,
      quantity,
    };
  });
}

export function getDirectEquipmentUpgrades(
  equipments: readonly Equipment[],
  equipmentId: string,
): readonly Equipment[] {
  return equipments.filter((equipment) => equipment.recipe?.includes(equipmentId));
}

export function getEquipmentBuildPaths(
  equipments: readonly Equipment[],
  equipmentId: string,
): readonly EquipmentBuildPath[] {
  const index = indexEquipment(equipments);
  const results: EquipmentBuildPath[] = [];

  function visit(currentId: string, path: readonly Equipment[]): void {
    const current = index.get(currentId);

    if (!current) {
      throw new Error(`Unknown equipment "${currentId}".`);
    }

    const nextPath = [...path, current];
    const upgrades = getDirectEquipmentUpgrades(equipments, currentId);

    if (upgrades.length === 0) {
      results.push({
        equipment: current,
        path: nextPath,
      });

      return;
    }

    for (const upgrade of upgrades) {
      if (nextPath.some((item) => item.equipmentId === upgrade.equipmentId)) {
        throw new Error(`Circular equipment recipe detected at "${upgrade.equipmentId}".`);
      }

      visit(upgrade.equipmentId, nextPath);
    }
  }

  visit(equipmentId, []);

  return results;
}
