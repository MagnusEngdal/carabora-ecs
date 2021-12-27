interface SetupProps {}

interface UpdateProps {
  t: number;
}

interface System {
  setup?: (data: any, props: SetupProps) => void;
  update: (data: any, props: UpdateProps) => void;
  query: string[];
}

export interface Component {}

interface ComponentStore {
  components: Record<string, Component>;
}

type Entity = number;

export const createEcs = () => {
  const components: Record<string, Component> = {};
  const entities = new Map<Entity, ComponentStore>();
  const systems = new Map<System, Set<Entity>>();

  const updateEntity = (entity: Entity) => {
    for (let s of systems.keys()) {
      updateSystem(entity, s);
    }
  };

  const updateSystem = (entity: Entity, system: System) => {
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
        components: {},
      });

      const entityHelpers = {
        add: <T>(name: string, init?: T) => {
          e.addComponent<T>(entity, name, init);
        },
      };

      return entityHelpers;
    },

    component: <T>(name: string, init?: T) => {
      components[name] = init ?? {};
      return name;
    },

    addComponent: <T>(entity: Entity, name: string, init?: T) => {
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

    system: (system: System) => {
      systems.set(system, new Set());
      for (let entity of entities.keys()) {
        updateSystem(entity, system);
      }
    },

    setup: () => {
      for (let [system, sysEntities] of systems) {
        if (typeof system.setup === "function") {
          for (let e of sysEntities) {
            system.setup(entities.get(e)?.components, {});
          }
        }
      }
    },

    update: (props?: { t?: number }) => {
      for (let [system, sysEntities] of systems) {
        for (let e of sysEntities) {
          system.update(entities.get(e)?.components, { t: 0, ...props });
        }
      }
    },
  };
  return e;
};
