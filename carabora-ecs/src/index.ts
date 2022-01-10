interface System<C, P> {
  setup?: (data: { id: number; c: C }) => void;
  update: (data: {
    id: number;
    c: C;
    payload: P;
    entities: ComponentStore[];
  }) => void;
  query: string[];
}

export type Component = any;

interface ComponentStore {
  id: number;
  components: Record<string, Component>;
}

type Entity = number;

export const createEcs = <P>() => {
  const components: Record<string, Component> = {};
  const entities = new Map<Entity, ComponentStore>();
  const systems = new Map<System<any, P>, Set<Entity>>();

  const updateEntity = (entity: Entity) => {
    for (let s of systems.keys()) {
      updateSystem(entity, s);
    }
  };

  const query = (components: string[]) => {};

  const updateSystem = (entity: Entity, system: System<any, any>) => {
    const ent = entities.get(entity);
    const sys = systems.get(system);
    if (!ent || !sys) return;

    let need = true;
    for (let req of system.query) {
      if (typeof ent.components[req] === "undefined") {
        need = false;
        break;
      }
    }

    if (need) {
      sys.add(entity);
    } else {
      sys.delete(entity);
    }
  };

  const e = {
    entity: () => {
      const entity = entities.size + 1;
      entities.set(entity, {
        id: entity,
        components: {},
      });

      const entityHelpers = {
        add: <T>(name: string, init?: T) => {
          e.addComponent<T>(entity, name, init);
        },
      };

      return entityHelpers;
    },

    entities: () => {},

    component: <C>(name: string, init?: C) => {
      components[name] = init ?? {};
      return name;
    },

    addComponent: <C>(entity: Entity, name: string, init?: C) => {
      const ent = entities.get(entity);

      if (
        typeof components[name] !== "undefined" &&
        ent &&
        !ent.components[name]
      ) {
        switch (typeof init) {
          case "object":
            ent.components[name] = { ...components[name], ...init };
            break;
          default:
            ent.components[name] = init ?? components[name];
        }
        updateEntity(entity);
      }
    },

    system: <C = any>(system: System<C, P>) => {
      systems.set(system, new Set());
      for (let entity of entities.keys()) {
        updateSystem(entity, system);
      }
    },

    setup: () => {
      for (let [system, sysEntities] of systems) {
        if (typeof system.setup === "function") {
          for (let e of sysEntities) {
            system.setup({
              id: e,
              c: entities.get(e)?.components,
            });
          }
        }
      }
    },

    update: (payload?: P) => {
      for (let [system, sysEntities] of systems) {
        const sysEntitiesArray = [...sysEntities.values()].map((id) => {
          const e = entities.get(id);
          if (!e) throw Error("Entity not found");
          return e;
        });
        for (let e of sysEntities) {
          const entity = entities.get(e);
          if (entity) {
            system.update({
              id: e,
              c: entity.components,
              payload: payload as P,
              entities: sysEntitiesArray,
            });
          }
        }
      }
    },
  };
  return e;
};
