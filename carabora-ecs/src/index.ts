export interface Entity<C> {
  id: number;
  add: <N extends keyof C>(name: N, init?: C[N]) => void;
  readonly components: Partial<C>;
}

type Components<C> = Partial<C>;

interface ComponentStore<C> {
  id: number;
  components: Partial<Record<keyof C, any>>;
}

interface System<C, P> {
  setup?: (props: { id: number; c: Components<C> }) => void;
  update: <O extends keyof C>(props: {
    id: number;
    c: C;
    payload: P;
    entities: ComponentStore<C>[];
  }) => void;
  query: (keyof C)[];
}

export const createEcs = <C = Record<string, any>, P = any>() => {
  const components: Components<C> = {};
  const entities = new Map<number, ComponentStore<C>>();
  const systems = new Map<System<C, P>, Set<number>>();

  const updateEntity = (entity: number) => {
    for (let s of systems.keys()) {
      updateSystem(entity, s);
    }
  };

  const updateSystem = (entity: number, system: System<C, P>) => {
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
        components: {} as Components<C>,
      });

      const entityHelpers: Entity<C> = {
        id: entity,
        add: <N extends keyof C>(name: N, init?: C[N]) => {
          if (typeof name === "string") {
            e.addComponent(entity, name, init);
          }
        },
        get components() {
          const e = entities.get(entity);

          if (!e) {
            throw Error(
              "Entity not found while attempting to retrive components"
            );
          }

          return e.components as Components<C>;
        },
      };

      return entityHelpers;
    },

    component: <I extends keyof C>(name: keyof C, init?: C[I]) => {
      components[name] = init ?? ({} as C[I]);
      return name;
    },

    addComponent: <I extends keyof C>(
      entity: number,
      name: keyof C,
      init?: C[I]
    ) => {
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

    system: (system: System<C, P>) => {
      systems.set(system, new Set());
      for (let entity of entities.keys()) {
        updateSystem(entity, system);
      }
    },

    setup: () => {
      for (let [system, sysEntities] of systems) {
        if (typeof system.setup === "function") {
          for (let e of sysEntities) {
            const ent = entities.get(e);
            if (ent) {
              system.setup({
                id: e,
                c: ent.components,
              });
            }
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
              c: entity.components as C,
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
