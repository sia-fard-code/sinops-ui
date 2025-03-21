document.addEventListener("DOMContentLoaded", function () {
  const resourceTypeList = [
    "charts",
    "configmaps",
    "external_secrets",
    "ingress",
    "jobs",
    "ns",
    "rolebinds",
    "roles",
    "sealed_secrets",
    "secret_stores",
    "secrets",
    "serviceacounts",
  ];
  const templateTypeList = ["container", "dag", "script", "suspend"];

  let autoLayout = false;
  let lastClickTime = 0;
  const doubleClickThreshold = 300; // Milliseconds
  let cy_original = cytoscape({
    container: document.getElementById("cy_org"),
  });

  let cy = cytoscape({
    container: document.getElementById("cy"),
    elements: [],
    style: [
      // Common node styles
      {
        selector: "node",
        style: {
          "background-color": "#ffffb3",
          label: "data(name)",
          color: "black",
          "text-outline-width": 1,
          "text-outline-color": "white",
          "text-valign": "top",
          "text-halign": "center",
          "font-size": "10px",
          "text-wrap": "wrap",
          "text-max-width": "180px",
          "text-margin-y": "4", // Adjust as needed
          width: function (ele) {
            return (ele.data("width") || 50) + "px";
          },
          height: function (ele) {
            return (ele.data("height") || 50)+ "px";
          },
        },
      },
      {
        selector: ".k8s",
        style: {
          "background-color": "#666",
          label: "data(name)",
          "background-image":
            "https://assets-global.website-files.com/64196dbe03e13c204de1b1c8/64773fb48f17ddf642943380_80-image-5.png", // Adjust the path as necessary
          "background-fit": "cover",
          "font-size": "30px",
          // 'background-width': '70%',
          // 'background-height': '70%'
        },
      },
      {
        selector: ".synops",
        style: {
          "background-color": "white",
          label: "data(name)",
          "background-image":
            "https://i.ibb.co/pvDFVtp/sinops-logo-2.png", // Adjust the path as necessary
          "background-fit": "cover",
          "font-size": "30px",
          // 'background-width': '70%',
          // 'background-height': '70%'
        },
      },

      {
        selector: ".manifest_repo, .metadata_repo, .config_repo",
        style: {
          "background-color": "#666",
          label: "data(name)",
          "background-image":
            "https://static-00.iconduck.com/assets.00/git-gui-icon-2048x2048-t4poesa1.png", // Adjust the path as necessary
          "background-fit": "cover",
          "font-size": "30px",
          // 'background-width': '70%',
          // 'background-height': '70%'
        },
      },
      // Specific node types using classes for common styles
      {
        selector:
          ".workflow_type, .workflow, .template, .task, .init, .app, .cluster, .env, .resource",
        style: {
          shape: "ellipse", // Default shape
        },
      },
      {
        selector: '.user',
        style: {
          'shape': 'triangle',
          'background-color': 'red'
        }
      },
      // Color coding for node types
      {
        selector: ".resource",
        style: { "background-color": "#bebada" }, // Purple
      },
      {
        selector: ".workflow_type",
        style: { "background-color": "#b35806", "font-size": "30px" }, // Purple
      },
      {
        selector: ".dag",
        style: { "background-color": "white", "font-size": "30px" }, // Purple
      },
      {
        selector: ".container, .script, .suspend",
        style: { "background-color": "#fee0b6", "font-size": "30px" }, // Indigo
      },
      {
        selector: ".workflow",
        style: {
          "background-color": "#998ec3",
          "font-size": "30px",
          label: "data(prefix)",
          "text-outline-color": "black",
          color: "white",
        }, // Indigo
      },
      {
        selector: ".template, .task",
        style: { "background-color": "#542788" }, // Indigo
      },
      {
        selector: ".init",
        style: { "background-color": "#1565c0", "font-size": "30px" }, // Blue
      },
      {
        selector: ".sync, .pre-sync, .post-sync",
        style: {
          "background-color": "#fb8072",
          "font-size": "30px",
        },
      },
      {
        selector: ".app",
        style: { "background-color": "#00838f", "font-size": "30px" }, // Cyan
      },
      {
        selector: ".cluster",
        style: {
          shape: "rectangle",
          "background-color": "#8dd3c7",
          "font-size": "30px",
        }, // Green
      },
      {
        selector: ".env",
        style: {
          shape: "diamond",
          "background-color": "#f9a825",
          "font-size": "30px",
        }, // Yellow
      },

      // Edge styles
      {
        selector: "edge",
        style: {
          "curve-style": "bezier",
          "target-arrow-shape": "triangle",
          "arrow-scale": 1.5,
          "line-color": "lime",
          "target-arrow-color": "lime",
          width: 2,
        },
      },
      {
        selector: ".env, .sync, .pre-sync, .post-sync, .resource",
        style: {
          shape: "diamond",
        },
      },
      // Interaction styles: Hover and selection
      {
        selector: "node:hover",
        style: {
          "border-width": 2,
          "border-color": "#333",
        },
      },
      {
        selector: "node:selected",
        style: {
          "border-width": 3,
          "border-color": "#AAA",
        },
      },
      // Edge handles plugin styles...
      // Hover and selection styles...
      {
        selector: "edge",
        style: {
          "curve-style": "bezier",
          "target-arrow-shape": "triangle",
          "arrow-scale": 1.5,
          "line-color": "black",
          "target-arrow-color": "black",
          width: 2,
        },
      },
      {
        selector: ".eh-handle",
        style: {
          "background-color": "red",
          width: 12,
          height: 12,
          shape: "ellipse",
          "overlay-opacity": 0,
          "border-width": 12, // makes the handle easier to hit
          "border-opacity": 0,
        },
      },

      {
        selector: ".eh-hover",
        style: {
          "background-color": "red",
        },
      },

      {
        selector: ".eh-source",
        style: {
          "border-width": 2,
          "border-color": "red",
        },
      },

      {
        selector: ".eh-target",
        style: {
          "border-width": 2,
          "border-color": "red",
        },
      },

      {
        selector: ".eh-preview, .eh-ghost-edge",
        style: {
          "background-color": "red",
          "line-color": "red",
          "target-arrow-color": "red",
          "source-arrow-color": "red",
        },
      },

      {
        selector: ".eh-ghost-edge.eh-preview-active",
        style: {
          opacity: 0,
        },
      },
    ],
    layout: {
      name: "dagre",
      align: "UL", // Align nodes to the Upper Left
      nodeSep: 30, // Node separation
      edgeSep: 30, // Edge separation
      rankSep: 30, // Rank separation
    },
  });

  // Example of applying classes to nodes dynamically or upon creation
  // cy.add({ group: 'nodes', data: { id: 'n1', name: 'Node 1' }, classes: 'workflow' });

  const contextMenu = document.getElementById("context-menu");

  // Listen for tap events on the Cytoscape canvas
  cy.on("tap", function (event) {
    // Check if the event target is the canvas itself, indicating a click outside of any node
    if (event.target === cy) {
      // Hide the properties panel
      document.getElementById("propertiesPanel").style.display = "none";
      document.getElementById("autocompleteSuggestions").style.display = "none";

      if (sourceNodeForEdge) {
        sourceNodeForEdge = null;
        document.getElementById("cy").style.cursor = "default";
      }
    }
  });

  let copiedNodeData = null; // This will store the data for the copied node
  cy.on("cxttap", (event) => {
    const target = event.target;
    let menuItems = [];
    if (target === cy) {
      menuItems.push({ name: "Add k8s", action: () => addNode("k8s", null, event.renderedPosition) });
    menuItems.push({
      name: "Add SynOps",
      action: () => addNode("synops", null, event.renderedPosition),
    });
    menuItems.push({
      name: "Add Role",
      action: () => addNode("role", null, event.renderedPosition),
    });
    menuItems.push({
      name: "Add SecOps",
      action: () => addNode("secops", null, event.renderedPosition),
    });
    menuItems.push({
      name: "Add CI/CD",
      action: () => addNode("cicd", null, event.renderedPosition),
    });

      menuItems.push({
        name: "Add Metadata Repo",
        action: () => addNode("metadata_repo", null, event.renderedPosition),
      });
      menuItems.push({
        name: "Add Manifest Repo",
        action: () => addNode("manifest_repo", null, event.renderedPosition),
      });
      menuItems.push({
        name: "Add Config Repo",
        action: () => addNode("config_repo", null, event.renderedPosition),
      });
    } else if (target.isNode()) {
      const type = target.data("cy_type");
      // Add 'Copy' option for all nodes
      menuItems.push({
        name: "Copy",
        action: () => {
          copiedNodeData = {
            data: Object.assign({}, target.data()), // Deep copy of the node data
            position: Object.assign({}, target.position()), // Copy position
            classes: Object.assign({}, target.classes()),
          };
          // Remove or modify the ID to ensure the pasted node is treated as a new entity
          delete copiedNodeData.data.id;
        },
      });

      // Add 'Paste' option only if there is something to paste
      if (copiedNodeData) {
        menuItems.push({
          name: "Paste",
          action: () => {
            // Adjust position or other properties as needed
            const newPosition = {
              x: target.position().x + 20,
              y: target.position().y + 20,
            };
            let nodeData = Object.assign({}, copiedNodeData.data); // Use a copy of the data to avoid mutation
            let nodeClass = Object.assign({}, copiedNodeData.classes); // Use a copy of the data to avoid mutation
            let nodePosition = newPosition;
            let nodeToAdd = {
              group: "nodes",
              data: nodeData,
              position: nodePosition,
              classes: nodeClass,
            };

            // Conditionally add the parent property only if the target is a parent
            // if (target.isParent()) {
            nodeToAdd.data.parent = target.id();
            // }

            const pastedNode = cy.add(nodeToAdd);
            // Optionally, create an edge from the target node to the new node
            // cy.add({
            //     group: 'edges',
            //     data: { source: target.id(), target: pastedNode.id() }
            // });
          },
        });
      }

      // menuItems.push({ name: 'Create Template', action: () => createTemplateFromNode(target) });

      if (type !== "sync")
        menuItems.push({ name: "Remove", action: () => removeNode(target) });
      // menuItems.push({ name: 'Edit Name', action: () => editNodeName(target) });

      if (type === "cluster") {
        menuItems.push({
          name: "Add Env",
          action: () => addNode("env", target),
        });
        menuItems.push({
          name: "Add Init",
          action: () => addNode("init", target),
        });
        menuItems.push({
          name: "Add Workflow Type",
          action: () => addNode("workflow_type", target),
        });
        // menuItems.push({ name: 'Connect to...', action: () => selectSourceNodeForEdge(target) });
      } else if (type === "secops" || type === "cicd") {
          menuItems.push({ name: "Add DAG", action: () => addNode("dag", target) });
      } else if (type === "synops") {
          menuItems.push({ name: "Add Cluster", action: () => addNode("cluster", target) });
      } else if (type === "role") {
          menuItems.push({ name: "Add User", action: () => addNode("user", target) });
      } else if (type === "workflow_type") {
        menuItems.push({
          name: "Add Workflow",
          action: () => addNode("workflow", target),
        });
      } else if (type === "workflow") {
        const templateTypeList = ["container", "dag", "script", "suspend"].map(
          (templateType) => ({
            name: templateType, // Display name in the sub-menu
            action: () => addNode(templateType, target), // Action to add the node
          }),
        );

        // Add the 'Add Resource Type' option with the sub-menu
        menuItems.push({
          name: "Add Template Type",
          subMenu: templateTypeList,
        });

        menuItems.push({
          name: "Add EventSource",
          action: () => addNode("es", target),
        });
        // menuItems.push({ name: 'Add template', action: () => addNode('template',target) });
      } else if (type === "dag") {
        menuItems.push({
          name: "Add Task",
          action: () => addNode("task", target),
        });
      } else if (templateTypeList.includes(type)) {
        menuItems.push({
          name: "Add Template",
          action: () => addNode("template", target),
        });
        // } else if (type === 'task') {
        //     menuItems.push({ name: 'Connect to Task', action: () => selectSourceNodeForEdge(target) });
        // } else if (type === 'template') {
        //     menuItems.push({ name: 'Connect to Task', action: () => selectSourceNodeForEdge(target) });
      } else if (type === "env") {
        menuItems.push({
          name: "Add App",
          action: () => addNode("app", target),
        });
      } else if (resourceTypeList.includes(type)) {
        menuItems.push({
          name: "Add Resource",
          action: () => addNode("resource", target),
        });
      } else if (type === "app") {
        // Add options for Pre-Sync and Post-Sync nodes
        // menuItems.push({ name: 'Connect to...', action: () => selectSourceNodeForEdge(target) });
        menuItems.push({
          name: "Add Pre-Sync",
          action: () => addNode("pre-sync", target),
        });
        menuItems.push({
          name: "Add Post-Sync",
          action: () => addNode("post-sync", target),
        });
      } else if (type === "pre-sync" || type === "post-sync") {
        const resourceTypeSubMenu = [
          "configmaps",
          "external_secrets",
          "ingress",
          "jobs",
          "rolebinds",
          "roles",
          "sealed_secrets",
          "secret_stores",
          "secrets",
          "serviceacounts",
        ].map((resourceType) => ({
          name: resourceType, // Display name in the sub-menu
          action: () => addNode(resourceType, target), // Action to add the node
        }));

        // Add the 'Add Resource Type' option with the sub-menu
        menuItems.push({
          name: "Add Resource Type",
          subMenu: resourceTypeSubMenu,
        });
      } else if (type === "sync" || type === "init") {
        // Initialize variable to hold whether 'env' node has 'default_ns: true'
        let hasDefaultNs = false;

        // Check if the node type is 'sync' before looking for 'env' node
        if (type === "sync") {
          // Assuming 'target' is your 'sync' or 'init' node, find its parent 'app' node
          let appNode = target.parent();

          // Then, find the 'app' node's parent 'env' node
          let envNode = appNode.length > 0 ? appNode.parent() : null;

          // Check if the 'env' node has 'default_ns: true'
          if (envNode && envNode.data("default_ns") === "true") {
            hasDefaultNs = true;
          }
        }

        // The rest of your logic for building the context menu
        const resourceTypeSubMenu = [
          "charts",
          "configmaps",
          "external_secrets",
          "ingress",
          "jobs",
          "ns",
          "rolebinds",
          "roles",
          "sealed_secrets",
          "secret_stores",
          "secrets",
          "serviceacounts",
        ]
          // For 'sync' nodes, conditionally include 'ns' based on 'hasDefaultNs'
          // For 'init' nodes, include all options without filtering based on 'hasDefaultNs'
          .filter(
            (resourceType) =>
              !(type === "sync" && hasDefaultNs && resourceType === "ns"),
          )
          .map((resourceType) => ({
            name: resourceType,
            action: () => addNode(resourceType, target),
          }));

        menuItems.push({
          name: "Add Resource Type",
          subMenu: resourceTypeSubMenu,
        });
      }
    }

    showContextMenu(event.renderedPosition, menuItems);
  });

  // Mouseover event listener to add hover style
  cy.on("mouseover", "node", function (event) {
    let node = event.target;
    node.style({
      "background-color": "gray",
      "border-width": "2px",
      "border-color": "#d50000",
    });
  });

  // Mouseout event listener to remove hover style
  cy.on("mouseout", "node", function (event) {
    let node = event.target;
    node.style({
      "background-color": "", // Reset to default or specify the original color
      "border-width": "", // Reset to default or specify the original width
      "border-color": "", // Reset to default or specify the original color
    });
  });
  cy.on("cxttap", "edge", (event) => {
    const targetEdge = event.target;
    let menuItems = [
      { name: "Remove Edge", action: () => removeEdge(targetEdge) },
      { name: "Edit Name", action: () => editEdgeName(targetEdge) },
    ];
    showContextMenu(event.renderedPosition, menuItems);
  });

  cy.on("add", "edge", function (event) {
    let edge = event.target;
    let sourceNode = cy.getElementById(edge.data("source"));
    let targetNode = cy.getElementById(edge.data("target"));

    const sourceType = sourceNode.data("cy_type");
    const targetType = targetNode.data("cy_type");

    // Check if the edge connects two tasks
    if (sourceType === "task" && targetType === "task") {
      // Update the target task node's dependencies to include the source
      let dependencies = targetNode.data("dependencies") || [];
      let sourceName = sourceNode.data("name");
      if (!dependencies.includes(sourceName)) {
        dependencies.push(sourceName);
        targetNode.data("dependencies", dependencies);
      }
    }
    // Check if the source is a template and the target is a task, then update the target task node with the template reference
    if (sourceType === "template" && targetType === "task") {
      targetNode.data("template", sourceNode.data("name"));
    }
  });

  cy.on("remove", "edge", function (event) {
    let edge = event.target;
    let sourceNode = cy.getElementById(edge.data("source"));
    let targetNode = cy.getElementById(edge.data("target"));

    const sourceType = sourceNode.data("cy_type");
    const targetType = targetNode.data("cy_type");

    // Check if the removed edge connected two tasks
    if (sourceType === "task" && targetType === "task") {
      // Remove the source task from the target task node's dependencies
      let dependencies = targetNode.data("dependencies") || [];
      let sourceName = sourceNode.data("name");
      let index = dependencies.indexOf(sourceName);
      if (index !== -1) {
        dependencies.splice(index, 1);
        targetNode.data("dependencies", dependencies);
      }
    }
    // Check if the source is a template and the target is a task, then update the target task node with the template reference
    if (sourceType === "template" && targetType === "task") {
      targetNode.data("template", "");
    }
  });

  // Show properties panel when a node is clicked
  cy.on("tap", "node", function (evt) {
    let node = evt.target;
    displayProperties(node);
    document.getElementById("autocompleteSuggestions").style.display = "none";
    let currentTime = new Date().getTime();
    if (currentTime - lastClickTime < doubleClickThreshold) {
      // Detected a double click
      toggleChildNodes(node);
    }
    lastClickTime = currentTime;
  });

  cy.on("add remove data", "node", function () {
    // updateNodeMapWithType(cy); // Call the centralized update function
  });

  let isResizing = false;
  let originalSize = 0;
  let nodeBeingResized = null;

  cy.on("tapstart", "node", function (evt) {
    // Cross-platform check for Ctrl (Windows/Linux) or Meta (macOS) key
    const isModifierKeyPressed = evt.originalEvent.metaKey;
    console.log("Tapstart with modifier key:", isModifierKeyPressed); // Debugging

    if (isModifierKeyPressed) {
      const node = evt.target;
      isResizing = true;
      nodeBeingResized = node;
      originalSize = node.width(); // Assuming width and height are equal

      // Lock the node to disable movement
      node.lock();
    }
  });

  cy.on("tapdrag", function (evt) {
    const isModifierKeyPressed =
      evt.originalEvent.ctrlKey || evt.originalEvent.metaKey;
    if (isResizing && nodeBeingResized && isModifierKeyPressed) {
      const newSize = Math.max(
        20,
        originalSize + (evt.position.x - nodeBeingResized.position("x")),
      );

      // Update node data with the new size
      nodeBeingResized.data("width", newSize);
      nodeBeingResized.data("height", newSize);

      // Apply the new size as a style (for immediate visual feedback)
      nodeBeingResized.style({
        width: newSize,
        height: newSize,
      });
    }
  });

  cy.on("tapend", function (evt) {
    if (isResizing) {
      isResizing = false;

      // Unlock the node to re-enable movement
      if (nodeBeingResized) {
        nodeBeingResized.unlock();
        nodeBeingResized = null;
      }
    }
  });

  // function createTemplateFromNode(node) {
  //   let template = {
  //     nodes: [],
  //     edges: [],
  //   };

  //   function collectElements(node) {
  //     // Add the current node to the template
  //     template.nodes.push({ data: { ...node.data() } });

  //     // Add edges connected to the node
  //     node.connectedEdges().forEach((edge) => {
  //       if (
  //         template.edges.findIndex((e) => e.data.id === edge.data().id) === -1
  //       ) {
  //         // Avoid duplicates
  //         template.edges.push({ data: { ...edge.data() } });
  //       }
  //     });

  //     // Recursively collect child nodes and their edges
  //     node.children().forEach((child) => collectElements(child));
  //   }

  //   collectElements(node);

  //   // At this point, 'template' contains the node, its children, and edges.
  //   // You can now use 'template' to add to the graph as needed.
  // }

  function toggleChildNodes(node) {
    let children = node.children();

    // Check if we are expanding or collapsing
    let collapsing = children.some(
      (child) => child.style("display") === "element",
    );

    children.forEach((child) => {
      child.style("display", collapsing ? "none" : "element");
      // If the child is also a parent, recursively hide its children as well
      if (collapsing && child.isParent()) {
        toggleChildNodes(child);
      }
    });

    // Optionally, re-run the layout to adjust the positions of the nodes
    // cy.layout({ name: 'preset' }).run(); // Adjust according to your preferred layout
  }

  function addNode(type, parent = null, pos = null) {
    const rand = Math.random().toString(36).substr(2, 3);
    let newPosition = { x: 20, y: 20 };
    if (parent){
      newPosition = {
        x: parent.position().x + 20,
        y: parent.position().y + 20,
      };
    } else {
        newPosition = pos;
    }
    const nodeId = `${type}_${rand}`;

    const customDataMapping = {
      charts: {
        helm: {
          url: "",
          name: "",
          revision: "",
        },
        values: {
          file: "",
        },
        ignoreDifferences: [],
        syncOptions: [],
      },
      configmaps: {
        data: [],
      },
      external_secrets: {
        data: [],
        refreshInterval: "",
        secretStoreRef: {},
        target: {},
      },
      ingress: {
        rules: [],
      },
      jobs: {
        image: "busybox",
        cmd: "/bin/sh",
        args: "ls .",
      },
      ns: {},
      rolebinds: {
        kind: "ClusterRoleBinding",
        roleRef: {},
        subjects: [],
      },
      roles: {},
      sealed_secrets: {
        cluster_wide: "",
        encryptedData: {
          ".dockerconfigjson": "",
        },
        type: "",
      },
      secret_stores: {
        kind: "ClusterSecretStore",
        sa: {
          name: "",
          ns: "",
        },
        region: "",
        service: "",
        secretRef: {
          secret_name: "",
          accessKeyID: "",
          secretAccessKey: "",
        },
      },
      secrets: {
        annotations: {},
        type: "",
        data: {},
        labels: {},
      },
      serviceacounts: {},
      workflow_type: { type: "resource" },
      workflow: {
        prefix: "",
        resource: "",
        wf: {
          wf_file: "",
        },
        filter: {
          afterStart: "",
          labels: [],
        },
        parameters: [
          {
            dataKey: "",
            dests: [],
          },
        ],
        imagePullSecrets: "harbor-creds",
        entrypoint: "synops",
        volumeClaimTemplates: [],
      },
      es: {
        resource: "",
        prefix: "",
        filter: {
          afterStart: "",
          labels: [],
        },
      },
      cluster: {
        // manifest_repo: '',
        // metadata_repo: '',
        // revision: '',
        // server: '',
      },
      env: {
        // manifest_repo: '',
        // metadata_repo: '',
        // revision: '',
        // server: '',
        default_ns: "false",
      },
      app: {
        // manifest_repo: '',
        // metadata_repo: '',
        // revision: '',
        // server: '',
      },
      resource: {
        // manifest_repo: manifest_repo,
        // metadata_repo: metadata_repo,
        // revision: revision,
        // server: server,
      },
      task: {
        template: "",
        arguments: {
          parameters: [],
        },
        withItems: [],
        dependencies: [],
      },
      dag: {
        dag: {
          tasks: [],
        },
      },
      container: {
        args: [],
        command: [],
        image: "",
        imagePullSecrets: "",
        volumeMounts: [],
        env: [],
        parameters: [],
        artifacts: [],
        retryStrategy: "",
        inputs: {},
        outputs: {},
        volumes: [],
      },
      script: {
        script: "",
        args: [],
        command: [],
        image: "",
        imagePullSecrets: "",
        volumeMounts: [],
        env: [],
        parameters: [],
        artifacts: [],
        retryStrategy: "",
        inputs: {},
        outputs: {},
        volumes: [],
      },
      suspend: {},
      k8s: {
        server: "https://kubernetes.default.svc",
        argo_ns: "argocd",
      },
      synops: {

      },
      manifest_repo: {
        url: "git@github.com:sia-fard-code/demo-manifests.git",
        revision: "main",
      },
      metadata_repo: {
        url: "git@github.com:sia-fard-code/demo-metadata.git",
        revision: "main",
      },
      config_repo: {
        url: "git@github.com:sia-fard-code/pfops-config.git",
        revision: "main",
        user: "Sia",
        email: "sia.gfard.code@gmail.com",
        ssh_key: "",
      },
      // Add more mappings as needed
      secops: {},
      cicd: {},
    };

    let name = `${type}-${rand}`;
    if (
      ["pre-sync", "sync", "post-sync", "ns"].includes(type) ||
      resourceTypeList.includes(type) ||
      templateTypeList.includes(type)
    )
      name = type;

    // Initialize default data for all nodes
    let defaultData = {
      id: nodeId,
      cy_type: type,
      name: name,
      cy_lock: "false",
      sync_wave: "0",
      parent: parent ? parent.id() : null,
    };

    if (parent) {
      // Apply uniqueness constraint only for Pre-Sync, Sync, and Post-Sync nodes
      if (
        ["pre-sync", "sync", "post-sync", "ns"].includes(type) ||
        resourceTypeList.includes(type)
      ) {
        const existing = parent.children(`[cy_type="${type}"]`);
        if (existing.length > 0) {
          alert(
            `${type.charAt(0).toUpperCase() + type.slice(1)} node already exists for this parent.`,
          );
          return; // Prevent adding another node of the same type
        }
      }
      if (type === "resource") {
        if (parent.data("cy_type") === "ns") {
          defaultData.name = "namespace";
          defaultData.sync_wave = "-1";
        } else {
          Object.assign(defaultData, customDataMapping[parent.data("cy_type")]);
          const nsNode = parent.data("ns");
          defaultData.ns = nsNode; // Set namespace based on ns node's name
        }
      }
      if (resourceTypeList.includes(type)) {
        // Find the ns node among the Sync node's children to set the namespace
        const nsNode = parent.children(`[cy_type="ns"]`).first();
        const nsRes = cy
          .nodes()
          .filter(
            (node) =>
              node.data("cy_type") === "resource" &&
              node.data("parent") ===
                parent.children(`[cy_type="ns"]`).first().id(),
          );
        if (nsRes.length > 0) {
          // Object.assign(defaultData, nsNode.data('name'));

          defaultData.ns = nsRes.data("name"); // Set namespace based on ns node's name
          // defaultData.namespace
        }
      }
      if (type === "template") {
        Object.assign(defaultData, customDataMapping[parent.data("cy_type")]);
        // const nsNode = parent.data('ns');
        // defaultData.ns = nsNode; // Set namespace based on ns node's name
      }
    }

    // Prepare the base node data structure
    let nodeData = {
      group: "nodes",
      data: defaultData,
      position: newPosition,
      classes: type,
    };

    // If there is custom data for this type, merge it with the default data
    if (customDataMapping[type]) {
      Object.assign(nodeData.data, customDataMapping[type]);
    }

    const newNode = cy.add(nodeData);

    // Automatically add a Sync node if an App node is added and there isn't one already
    if (type === "app") {
      // Check if the App node already has a Sync node
      const existingSync = newNode.children(`[cy_type="sync"]`);
      if (existingSync.length === 0) {
        const syncNode = addNode("sync", newNode);
        if (syncNode) {
          addNode("ns", syncNode);
          // addNode('resource', newNS);
        }
      }
    } else if (type === "pre-sync" || type === "post-sync") {
      const newJob = addNode("jobs", newNode);
      // addNode('resource', newJob);
    } else if (resourceTypeList.includes(type)) {
      addNode("resource", newNode);
    } else if (type === "dag") {
      addNode("task", newNode);
    } else if (type === "synops") {
      addNode("cluster", newNode);
    } else if (type === "role") {
      addNode("user", newNode);
    } else if (type === "env") {
      addNode("app", newNode);
    } else if (type === "secops" || type === "cicd") {
      addNode("dag", newNode);
    } else if (templateTypeList.includes(type)) addNode("template", newNode);

    if (autoLayout) {
      cy.nodes('[cy_type="cluster"]').lock();
      cy.nodes('[cy_type="env"]').lock();
      cy.layout({
        name: "dagre", // or 'dagre' for hierarchical data
        animate: true,
        animationDuration: 200,
        rankDir: "LR", // Layout direction: Left-to-Right
        align: "UL", // Align nodes to the Upper Left
        nodeSep: 100, // Node separation
        edgeSep: 100, // Edge separation
        rankSep: 100, // Rank separation
      }).run();
      cy.nodes('[cy_type="cluster"]').unlock();
      cy.nodes('[cy_type="env"]').unlock();
    }
    // cy.layout({ name: 'preset' }).run();
    document.getElementById("autocompleteSuggestions").style.display = "none";
    return newNode;
  }

  function removeNode(target) {
    target.remove();
  }

  // function openWorkflowDiagram(node) {
  //   const workflowWindow = window.open("workflow.html", "_blank");
  //   // Pass data to the new window, e.g., using localStorage, query params, etc.
  //   // Example: localStorage.setItem('nodeId', node.id());
  // }

  function showContextMenu(pos, items) {
    const menu = document.querySelector("#context-menu ul");
    menu.innerHTML = "";

    items.forEach((item) => {
      const menuItem = document.createElement("li");
      menuItem.textContent = item.name;

      if (item.subMenu && item.subMenu.length > 0) {
        // Create a sub-menu if it exists
        const subMenu = document.createElement("ul");
        subMenu.className = "sub-menu"; // Make sure to style this appropriately in CSS

        item.subMenu.forEach((subItem) => {
          const subMenuItem = document.createElement("li");
          subMenuItem.textContent = subItem.name;
          subMenuItem.onclick = () => {
            subItem.action();
            hideContextMenu();
          };
          subMenu.appendChild(subMenuItem);
        });

        menuItem.appendChild(subMenu);
        // Optionally, add a visual cue that this item has a sub-menu
        menuItem.classList.add("has-sub-menu"); // Style this in CSS
      } else {
        // For items without a sub-menu, directly assign the click action
        menuItem.onclick = () => {
          item.action();
          hideContextMenu();
        };
      }

      menu.appendChild(menuItem);
    });

    contextMenu.style.left = `${pos.x}px`;
    contextMenu.style.top = `${pos.y}px`;
    contextMenu.style.display = "block";
  }
  window.addEventListener("click", () => hideContextMenu());

  function hideContextMenu() {
    contextMenu.style.display = "none";
  }

  // the default values of each option are outlined below:
  let ehDefaults = {
    canConnect: function (sourceNode, targetNode) {
      // Extract 'cy_type' data for source and target nodes for easier comparison
      const sourceType = sourceNode.data("cy_type");
      const targetType = targetNode.data("cy_type");

      if (sourceNode.same(targetNode)) {
        // Disallow loops
        prepareTooltip(sourceNode, "Loop connections are not allowed.");
        return false;
      }

      // Check if the edge between source and target nodes should be allowed based on 'cy_type'
      if (
        (sourceType === "template" || sourceType === "task") &&
        targetType === "task"
      ) {
        // Additional validation logic previously in getEdgeParams
        // For example, ensuring a task is not connected to multiple templates:
        if (sourceType === "template") {
          const existingTemplateConnection = cy.edges().some((edge) => {
            return (
              targetNode.parent === sourceNode.parent &&
              edge.data("target") === targetNode.id() &&
              cy.getElementById(edge.data("source")).data("cy_type") ===
                "template"
            );
          });
          if (existingTemplateConnection) {
            prepareTooltip(
              sourceNode,
              "A task can only be connected to one template.",
            );
            return false;
          }
        }

        return true;
      } else if (
        (sourceType === "cluster" || sourceType === "env" || sourceType === "synops") &&
        (targetType === "k8s" ||
          targetType === "manifest_repo" ||
          targetType === "metadata_repo")
      ) {
        return true;
      } else if (sourceType === "app" && targetType === "app") {
        return true;
      } else if (sourceType === "user") {
        return true;
      } else if (sourceType === "dag" && (targetType === "app"  || targetType === "env" || targetType === "cluster")) {
        return true;
      } else if (
        (sourceType === "cluster" ||
          sourceType === "env" ||
          sourceType === "workflow") &&
        targetType === "env"
      ) {
        return true;
      }

      // If none of the conditions match, do not allow the connection
      // prepareTooltip(sourceNode, "Invalid connection based on node types.");
      return false;
    },

    edgeParams: function (sourceNode, targetNode) {
      // Generate a unique ID for the new edge
      const edgeId = `edge_${Math.random().toString(36).substr(2, 9)}`;

      // Define the basic parameters for the new edge
      const edgeParams = {
        group: "edges",
        data: {
          id: edgeId,
          source: sourceNode.id(),
          target: targetNode.id(),
          // Customize your edge data here
          name: "New Edge",
          type: "customType", // Define your edge type based on your application's needs
        },
      };

      return edgeParams;
    },
    hoverDelay: 150, // time spent hovering over a target node before it is considered selected
    snap: true, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
    snapThreshold: 50, // the target node must be less than or equal to this many pixels away from the cursor/finger
    snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
    noEdgeEventsInDraw: true, // set events:no to edges during draws, prevents mouseouts on compounds
    disableBrowserGestures: true, // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
  };

  let eh = cy.edgehandles(ehDefaults);

  function prepareTooltip(node, message) {
    // This function could dispatch a custom event with details on where to show the tooltip and what message to display
    const event = new CustomEvent("showTooltip", {
      detail: {
        position: node.renderedPosition(),
        message: message,
      },
    });
    document.dispatchEvent(event);
  }

  // Elsewhere in your code, listen for this event
  document.addEventListener("showTooltip", function (e) {
    const details = e.detail;
    showTooltip(details.position, details.message); // Assuming showTooltip is implemented as shown in previous examples
  });

  function showTooltip(position, message) {
    const tooltip = document.getElementById("cy-tooltip");
    tooltip.style.left = `${position.x}px`;
    tooltip.style.top = `${position.y + 20}px`; // Offset by 20px or as needed
    tooltip.textContent = message;
    tooltip.style.display = "block";

    // Hide the tooltip after a delay
    setTimeout(() => {
      tooltip.style.display = "none";
    }, 3000); // Adjust delay as needed
  }

  let sourceNodeForEdge = null; // To keep track of the source node for edge creation

  // function selectSourceNodeForEdge(node) {
  //   sourceNodeForEdge = node;
  //   document.getElementById("cy").style.cursor = "crosshair"; // Change cursor to indicate edge creation mode

  //   // Determine the target node types based on the source node type
  //   let targetType =
  //     node.data("cy_type") === "task" || node.data("cy_type") === "template"
  //       ? "task"
  //       : node.data("cy_type") === "app"
  //         ? "app"
  //         : "env";

  //   // Listen for the next node click to establish the target node
  //   cy.one("tap", `node[cy_type="${targetType}"]`, (event) => {
  //     const targetNode = event.target;
  //     if (sourceNodeForEdge !== targetNode) {
  //       // Prevent self-loop
  //       addEdge(sourceNodeForEdge, targetNode);
  //     }
  //     sourceNodeForEdge = null;
  //     document.getElementById("cy").style.cursor = "default";
  //   });
  // }

  function removeEdge(edge) {
    cy.remove(edge);
  }

  function editEdgeName(edge) {
    const newName = prompt("Edit edge name:", edge.data("name"));
    if (newName != null) {
      edge.data("name", newName);
    }
  }

  let drawSrart = false;
  document.getElementById("drawSrart").addEventListener("change", function () {
    drawSrart = this.checked;
    if (drawSrart) eh.enableDrawMode();
    else eh.disableDrawMode();
  });

  document
    .getElementById("autoLayoutCheckbox")
    .addEventListener("change", function () {
      autoLayout = this.checked;
      if (autoLayout) {
        cy.nodes('[cy_type="cluster"]').lock();
        cy.nodes('[cy_type="env"]').lock();
        cy.layout({
          name: "dagre", // or 'dagre' for hierarchical data
          animate: true,
          animationDuration: 200,
          // rankDir: 'LR', // Layout direction: Left-to-Right
          align: "UL", // Align nodes to the Upper Left
          nodeSep: 30, // Node separation
          edgeSep: 30, // Edge separation
          rankSep: 30, // Rank separation
        }).run();
        cy.nodes('[cy_type="cluster"]').unlock();
        cy.nodes('[cy_type="env"]').unlock();
      }
    });
  // let nodes = [
  //     { id: "env1", name: "Production", cy_type: "env" },
  //     { id: "app1", name: "MyApp", cy_type: "app", parent: "env1" },
  //     { id: "sync1", cy_type: "sync", parent: "app1" },
  //     { id: "resourceType1", name: "MyChart", cy_type: "charts", parent: "sync1" },
  //     { id: "resourceType2", name: "MyNS", cy_type: "ns", parent: "sync1" },
  //     { id: "resource1", name: "Myresource1", cy_type: "resource", parent: "resourceType1" },
  //     { id: "resource2", name: "Myresource2", cy_type: "resource", parent: "resourceType2" },
  //     // More nodes...
  // ];

  // function showApplicationNames(textarea, envId, hashPosition) {
  //   const appNodes = cy
  //     .nodes()
  //     .filter(
  //       (node) =>
  //         node.data("cy_type") === "app" && node.data("parent") === envId,
  //     );
  //   const autocompleteBox = document.getElementById("autocompleteSuggestions");
  //   autocompleteBox.innerHTML = "";

  //   appNodes.forEach((appNode) => {
  //     const appName = appNode.data("name");
  //     const div = document.createElement("div");
  //     div.textContent = appName;
  //     div.addEventListener("click", function () {
  //       // Correctly insert the application ID into the textarea
  //       const insertionPoint = hashPosition + 1; // Assuming you want to insert right after the '#'
  //       const textBeforeInsertion = textarea.value.substring(0, insertionPoint);
  //       const textAfterInsertion = textarea.value.substring(insertionPoint);
  //       textarea.value = `${textBeforeInsertion}${appNode.id() + "."}${textAfterInsertion}`;
  //       autocompleteBox.style.display = "none";
  //       displayAppProperties(appNode.id());

  //       // Now that an app has been selected, call displayResourceTypes
  //       displayResourceTypes(textarea, appNode.id());
  //     });
  //     autocompleteBox.appendChild(div);
  //   });
  //   displayAutocompleteBox(textarea, autocompleteBox);
  // }

  function displayAutocompleteBox(textarea, autocompleteBox) {
    if (autocompleteBox.innerHTML !== "") {
      const rect = textarea.getBoundingClientRect();
      autocompleteBox.style.display = "block";
      autocompleteBox.style.left = `${rect.left + window.scrollX}px`;
      autocompleteBox.style.top = `${rect.bottom + window.scrollY}px`;
    } else {
      autocompleteBox.style.display = "none";
    }
  }

  function displayResourceTypes(textarea, appId) {
    const autocompleteBox = document.getElementById("autocompleteSuggestions");
    autocompleteBox.innerHTML = ""; // Clear previous suggestions

    // Find the 'sync' node that is a child of the selected application
    const syncNode = cy
      .nodes()
      .filter(
        (node) =>
          node.data("cy_type") === "sync" && node.data("parent") === appId,
      )
      .first();

    if (!syncNode) {
      console.log("No sync node found for the selected application.");
      return;
    }

    // Find all 'resourceType' nodes that are children of the 'sync' node
    const resourceTypeNodes = cy
      .nodes()
      .filter(
        (node) =>
          resourceTypeList.includes(node.data("cy_type")) &&
          node.data("parent") === syncNode.id(),
      );

    resourceTypeNodes.forEach((resourceTypeNode) => {
      const resourceName = resourceTypeNode.data("name"); // Assuming 'name' holds the resource type name
      const div = document.createElement("div");
      div.textContent = resourceName;
      div.addEventListener("click", function () {
        // Append the selected resourceType name after the appID
        const currentText = textarea.value;
        // Assuming the current text ends with the appID, find the last dot position to insert the resourceType name correctly
        const lastDotIndex = currentText.lastIndexOf(".");
        const textBeforeLastDot = currentText.substring(0, lastDotIndex + 1); // Include the dot in the substring
        const textAfterLastDot = currentText.substring(lastDotIndex + 1);
        // Construct the new value to include the resourceType name
        textarea.value = `${textBeforeLastDot}${resourceTypeNode.id() + ".name"}${textAfterLastDot}`;
        autocompleteBox.style.display = "none";
        // Optionally, you can call a function to display properties of the selected resourceType
      });
      autocompleteBox.appendChild(div);
    });

    displayAutocompleteBox(textarea, autocompleteBox); // Adjust this function if necessary to position the box correctly
  }

  let syncId;
  async function showNodes(textarea, currentLevel, identifier, hashPosition) {
    const autocompleteBox = document.getElementById("autocompleteSuggestions");
    autocompleteBox.innerHTML = ""; // Clear previous suggestions

    let nodes;

    switch (currentLevel) {
      case "env":
        nodes = cy.nodes().filter((node) => node.data("cy_type") === "env");
        break;
      case "app":
        const resolvedEnvId = cy
          .nodes()
          .filter(
            (node) =>
              node.data("cy_type") === "env" &&
              node.data("name") === identifier,
          )
          .id();
        nodes = cy
          .nodes()
          .filter(
            (node) =>
              node.data("cy_type") === "app" &&
              node.data("parent") === resolvedEnvId,
          );
        break;
      case "sync":
        const resolvedAppId = cy
          .nodes()
          .filter(
            (node) =>
              node.data("cy_type") === "app" &&
              node.data("name") === identifier,
          )
          .id();
        nodes = cy
          .nodes()
          .filter(
            (node) =>
              node.data("cy_type") === "sync" &&
              node.data("parent") === resolvedAppId,
          );
        break;
      case "resourceType":
        // Assuming 'identifier' is the app name from which to derive the syncId
        const resolvedAppIdForRT = cy
          .nodes()
          .filter(
            (node) =>
              node.data("cy_type") === "app" &&
              node.data("name") === identifier,
          )
          .id();
        syncId = cy
          .nodes()
          .filter(
            (node) =>
              node.data("cy_type") === "sync" &&
              node.data("parent") === resolvedAppIdForRT,
          )
          .id();
        // Filter for nodes that are of the types specified in the resourceType list and have the syncId as parent
        nodes = cy
          .nodes()
          .filter(
            (node) =>
              resourceTypeList.includes(node.data("cy_type")) &&
              node.data("parent") === syncId,
          );
        break;
      case "resource":
        // Assuming 'identifier' is the resourceType name
        const resourceTypeId = cy
          .nodes()
          .filter(
            (node) =>
              node.data("cy_type") === identifier &&
              node.data("parent") === syncId,
          )
          .id();
        nodes = cy
          .nodes()
          .filter(
            (node) =>
              node.data("cy_type") === currentLevel &&
              node.data("parent") === resourceTypeId,
          );
        syncId = null;
        break;
    }

    // Displaying filtered nodes in the autocomplete box
    nodes.forEach((node) => {
      const nodeName = node.data("name"); // Assuming the 'name' field holds the display name
      const nodeId = node.data("id");
      const div = document.createElement("div");
      div.textContent = nodeName;
      div.addEventListener("click", function () {
        // Insertion logic remains the same
        const insertionPoint =
          hashPosition !== undefined ? hashPosition + 1 : textarea.value.length;
        const textBeforeInsertion = textarea.value.substring(0, insertionPoint);
        const textAfterInsertion = textarea.value.substring(insertionPoint);
        textarea.value = `${textBeforeInsertion}${nodeName}${textAfterInsertion}`;
        autocompleteBox.style.display = "none";
        textarea.focus();
        const newPos = textBeforeInsertion.length + nodeName.length;
        textarea.setSelectionRange(newPos, newPos);
        if (currentLevel === "resource")
          // If a resource node is selected, show its data properties
          showResourceDataProperties(textarea, nodeId, newPos);
      });
      autocompleteBox.appendChild(div);
    });

    displayAutocompleteBox(textarea, autocompleteBox);
  }

  function showResourceDataProperties(textarea, resourceId, hashPosition) {
    const autocompleteBox = document.getElementById("autocompleteSuggestions");
    autocompleteBox.innerHTML = ""; // Clear previous suggestions

    // Find the selected resource node by its ID
    const resourceNode = cy
      .nodes()
      .filter((node) => node.id() === resourceId)
      .first();

    if (!resourceNode.length) {
      console.log("No resource node found with the specified ID.");
      return;
    }

    // Access the JSON data stored in the node
    const jsonData = resourceNode.data();

    // Check if jsonData is valid and not empty
    if (!jsonData || Object.keys(jsonData).length === 0) {
      console.log("No data properties found for the selected resource.");
      return;
    }

    // Iterate over the keys of the jsonData object
    Object.keys(jsonData).forEach((key) => {
      const div = document.createElement("div");
      div.textContent = key; // Display the key in the autocomplete suggestion
      div.addEventListener("click", function () {
        // Construct the new value for the textarea based on the selected key
        const insertionPoint =
          hashPosition !== undefined ? hashPosition : textarea.value.length;
        const textBeforeInsertion = textarea.value.substring(0, insertionPoint);
        const textAfterInsertion = textarea.value.substring(insertionPoint);
        const newText = `${textBeforeInsertion}${"." + key}${textAfterInsertion}`;
        textarea.value = newText;
        autocompleteBox.style.display = "none";

        // Move cursor to the end of the inserted text
        textarea.focus();
        const newPos = textBeforeInsertion.length + key.length + 1;
        textarea.setSelectionRange(newPos, newPos);
        autocompleteBox.style.display = "none"; // Clear previous suggestions
      });
      autocompleteBox.appendChild(div);
    });

    displayAutocompleteBox(textarea, autocompleteBox);
  }

  function exportGraph(cy) {
    const graphJson = cy.json(); // Get the current graph state as a JSON object
    const graphJsonString = JSON.stringify(graphJson); // Convert the JSON object to a string for storage
    return graphJsonString;
  }

  function importGraph(cy, graphJsonString) {
    let graphJson = JSON.parse(graphJsonString); // Parse the JSON string back into a JSON object

    // Remove any existing style information from the graph JSON
    delete graphJson.style;

    // Assign classes to nodes and edges based on their properties
    graphJson = processAndAssignClasses(graphJson);

    // Set the graph's state to the one specified in the processed JSON object
    cy.json(graphJson);
    // Correctly store the original JSON for later use
    cy_original.json(JSON.parse(JSON.stringify(graphJson)));
  }

  // Helper function to process nodes and edges to assign classes based on specific properties
  function processAndAssignClasses(graphData) {
    // Check if nodes exist and process each node
    if (graphData.elements.nodes) {
      graphData.elements.nodes.forEach((node) => {
        // Example: Assign a class based on the `cy_type` property
        if (node.data.cy_type) {
          node.classes = node.data.cy_type; // Assign the value of `cy_type` as a class
        }
      });
    }

    // Check if edges exist and process each edge
    if (graphData.elements.edges) {
      graphData.elements.edges.forEach((edge) => {
        // Example: Assign class based on a custom property, e.g., `relation`
        if (edge.data.relation) {
          edge.classes = edge.data.relation; // Assign the value of `relation` as a class
        }
      });
    }

    return graphData;
  }

  function toYaml(cy, jsonOutput = false) {
    const elements = JSON.parse(JSON.stringify(cy.json().elements));
    const clusters = [];
    const inits = [];
    const environments = [];
    const applications = [];
    const syncs = [];
    const preSyncs = [];
    const postSyncs = [];
    const resources = [];
    const resourceTypes = {};
    const workflows = [];
    const workflow_types = [];
    const templateTypes = {};
    const templates = [];
    const tasks = [];
    const es = [];
    const dagNodes = [];
    // const appDependencies = {};
    const globalAppDependencies = {}; // Map: App ID => Array of Dependent App IDs
    const globalApplications = {}; // Map: App ID => { name, envName, clusterName }
    // const workflowsData = {};
    const edges = [];
    const k8s = [];
    const manifest_repos = [];
    const metadata_repos = [];
    let manifest_repo; // = 'git@github.com:sia-fard-code/demo-manifests.git';
    let metadata_repo; // = 'git@github.com:sia-fard-code/demo-metadata.git';
    let manifestRevision; // = 'main';
    let metadataRevision; // = 'main';
    let server; // = 'https://kubernetes.default.svc';

    // Initialize your clusters object with manifest and metadata
    const graphData = {
      clusters: {
        manifest: {}, // Initialize manifest as an empty object
        metadata: [], // Initialize metadata as an empty array
      },
    };

    // Traverse the Cytoscape graph to populate the graphData object
    elements.nodes.forEach((node) => {
      const data = node.data;
      switch (data.cy_type) {
        case "cluster":
          clusters.push(data);
          break;
        case "init":
          inits.push(data);
          break;
        case "workflow_type":
          workflow_types.push(data);
          break;
        case "workflow":
          workflows.push(data);
          break;
        case "env":
          environments.push(data);
          break;
        case "app":
          applications.push(data);
          break;
        case "sync":
          syncs.push(data);
          break;
        case "pre-sync":
          preSyncs.push(data);
          break;
        case "post-sync":
          postSyncs.push(data);
          break;
        case "resource":
          resources.push(data);
          break;
        case "template":
          templates.push(data);
          break;
        case "task":
          tasks.push(data);
          break;
        case "k8s":
          k8s.push(data);
          break;
        case "metadata_repo":
          metadata_repos.push(data);
          break;
        case "manifest_repo":
          manifest_repos.push(data);
          break;
        case "es":
          es.push(data);
          break;
        // Handling specific resource types directly
        case "charts":
        case "configmaps":
        case "external_secrets":
        case "ingress":
        case "jobs":
        case "ns":
        case "rolebinds":
        case "roles":
        case "sealed_secrets":
        case "secret_stores":
        case "secrets":
        case "serviceacounts":
          // Initialize the array for this type if it doesn't exist
          if (!resourceTypes[data.cy_type]) {
            resourceTypes[data.cy_type] = [];
          }
          resourceTypes[data.cy_type].push(data);
          break;
        case "dag":
          dagNodes.push(data);
          break;
        case "suspend":
        case "container":
        case "script":
          // Initialize the array for this type if it doesn't exist
          if (!templateTypes[data.cy_type]) {
            templateTypes[data.cy_type] = [];
          }
          templateTypes[data.cy_type].push(data);
      }
    });
      elements.edges?.forEach((edge) => {
        edges.push(edge.data);
      });
    // Process edges to establish dependencies
    const clusterEnvConnections = {}; // Map: Env ID => Array of Connected Env IDs

    // Process edges to establish dependencies and connections
    if (Array.isArray(elements.edges)) {
      elements.edges.forEach((edge) => {
        const { source, target } = edge.data;

        // Handle connections between applications
        if (!globalAppDependencies[source]) {
          globalAppDependencies[source] = [];
        }
        globalAppDependencies[source].push(target);

        // New block: Handle connections between environments
        const sourceNode = elements.nodes.find(
          (node) => node.data.id === source,
        );
        const targetNode = elements.nodes.find(
          (node) => node.data.id === target,
        );
        if (
          sourceNode.data.cy_type === "cluster" &&
          targetNode.data.cy_type === "env"
        ) {
          if (!clusterEnvConnections[source]) {
            clusterEnvConnections[source] = [];
          }
          clusterEnvConnections[source].push(target);
        }
      });
    }
    // Initialize a global map to track application details

    applications.forEach((app) => {
      // Assuming 'app' includes 'id', 'name', and references to 'envId' and 'clusterId'
      const env = environments.find((e) => e.id === app.parent);
      const cluster = clusters.find((c) => c.id === env.parent);
      globalApplications[app.id] = {
        name: app.name,
        envName: env.name,
        clusterName: cluster.name,
      };
    });

    // function findClusterAndEnv(
    //   workflow,
    //   workflowTypes,
    //   clusters,
    //   environments,
    // ) {
    //   const workflowType = workflowTypes.find(
    //     (wt) => wt.id === workflow.parent,
    //   );
    //   const cluster = clusters.find(
    //     (cluster) => cluster.id === workflowType.parent,
    //   );
    //   const env = environments.find((env) => env.parent === cluster.id);
    //   return { clusterName: cluster.name, envName: env.name };
    // }

    function createTaskYaml(task) {
      return {
        id: task.id,
        name: task.name,
        template: task.template,
        arguments: {
          parameters: task.arguments.parameters,
        },
        withItems: task.withItems,
        dependencies: task.dependencies,
      };
    }

    function createTemplateYaml(template, type) {
      // Start with the common structure
      let yaml = {
        id: template.id,
        name: template.name,
        inputs: {
          parameters: template.parameters,
          artifacts: template.artifacts,
        },
        retryStrategy: template.retryStrategy,
        volumes: template.volumes,
        suspend: template.suspend,
      };

      // Conditionally add sections based on the type
      if (type === "container") {
        yaml.container = {
          args: template.args,
          command: template.command,
          image: template.image,
          imagePullSecrets: template.imagePullSecrets,
          volumeMounts: template.volumeMounts,
          env: template.env,
        };
      } else if (type === "script") {
        yaml.script = {
          source: template.script,
          args: template.args,
          command: template.command,
          image: template.image,
          imagePullSecrets: template.imagePullSecrets,
          volumeMounts: template.volumeMounts,
          env: template.env,
        };
      } else if (type === "suspend") {
        // If additional properties are needed for 'suspend', add them here
        yaml.suspend = {};
      }

      // Return the dynamically constructed object
      return yaml;
    }

    function generateWorkflowYaml(
      clusterName,
      workflow,
      templateTypes,
      dagNodes,
      tasks,
      templates,
      workflowToEnvEdge,
    ) {
      envName = environments.find(
        (env) => env.id === workflowToEnvEdge.target,
      ).name;
      // envName = environments.find(env => env.id === workflowToEnvEdge.data.target).name;
      let workflowYaml = {
        apiVersion: "argoproj.io/v1alpha1",
        kind: "Workflow",
        metadata: {
          generateName: `${clusterName}-artifact-`,
          namespace: `${clusterName}-${envName}`,
        },
        spec: {
          entrypoint: workflow.entrypoint,
          imagePullSecrets: [
            {
              name: workflow.imagePullSecrets,
            },
          ],
          serviceAccountName: `${clusterName}-pfops-wf`,
          templates: [],
          volumeClaimTemplates: workflow.volumeClaimTemplates,
        },
      };
      let dag = dagNodes.find((d) => d.parent === workflow.id);
      if (dag) {
        let dagTemplate = {
          name: "pfops",
          dag: {
            tasks: [],
          },
        };

        let dagTasks = tasks.filter((task) => task.parent === dag.id);
        dagTasks.forEach((task) => {
          let taskYaml = createTaskYaml(task);
          dagTemplate.dag.tasks.push(taskYaml);
        });

        workflowYaml.spec.templates.push(dagTemplate);
      }

      // Iterate through each template type category (suspend, container, script)
      Object.keys(templateTypes).forEach((type) => {
        // For each type, find templates that belong to the current workflow
        templateTypes[type].forEach((templateType) => {
          // Now find all templates whose parent matches the templateType.id (which is now the data object)
          let childTemplates = templates.filter(
            (template) =>
              template.parent === templateType.id &&
              templateType.parent === workflow.id,
          );
          // For each child template, create its YAML representation and add it to the workflowYaml
          childTemplates.forEach((template) => {
            let templateYaml = createTemplateYaml(template, type); // Assuming createTemplateYaml needs the template and its type
            workflowYaml.spec.templates.push(templateYaml);
          });
        });
      });
      return workflowYaml;
      // Convert the workflowYaml object to a YAML string
      // return jsyaml.dump(workflowYaml, { lineWidth: -1 });
    }

    function resolveNodeReferences(elements, lookupFunction) {
      function resolveValue(value) {
        if (typeof value === "string") {
          // Adjusted regex to include ':' for resource type and resource separation, and '-' in names
          return value.replace(
            /#(?:([^.#:]+)\.)?([^.#:]+)\.([^.#:]+):([^.#:]+)\.([^.#:]+)/g,
            (match, envName, appName, resourceType, resourceName, property) => {
              const effectiveEnvName = envName; // Use a default or contextual envName if not specified in the reference
              const resolvedValue = lookupFunction(
                effectiveEnvName,
                appName,
                resourceType,
                resourceName,
                property,
                elements,
              );
              return resolvedValue !== undefined ? resolvedValue : match; // If not resolved, keep the original match
            },
          );
        } else if (typeof value === "object" && value !== null) {
          // If it's an object (and not null), recursively resolve its properties
          Object.keys(value).forEach((key) => {
            value[key] = resolveValue(value[key]);
          });
          return value;
        }
        // Return the value unchanged if it's neither a string nor an object
        return value;
      }

      elements.nodes.forEach((node) => {
        Object.keys(node.data).forEach((key) => {
          node.data[key] = resolveValue(node.data[key]); // Resolve for both strings and objects
        });
      });
    }

    function lookupReference(
      envName,
      appName,
      resourceType,
      resourceName,
      property,
      elements,
    ) {
      let envNode, appNode, syncNode, resourceTypeNode, specificResourceNode;

      // Find the environment node by name, if provided
      if (envName) {
        envNode = elements.nodes.find(
          (node) => node.data.cy_type === "env" && node.data.name === envName,
        );
      }

      // Find the application node within the specified environment or across all environments if envName is not provided
      if (envNode) {
        appNode = elements.nodes.find(
          (node) =>
            node.data.cy_type === "app" &&
            node.data.name === appName &&
            node.data.parent === envNode.data.id,
        );
      } else {
        appNode = elements.nodes.find(
          (node) => node.data.cy_type === "app" && node.data.name === appName,
        );
      }

      // Find the sync node that is a child of the selected application
      if (appNode) {
        syncNode = elements.nodes.find(
          (node) =>
            node.data.cy_type === "sync" &&
            node.data.parent === appNode.data.id,
        );
      }

      // Find the resourceType node under the sync node by resourceType name
      if (syncNode && resourceType) {
        resourceTypeNode = elements.nodes.find(
          (node) =>
            node.data.cy_type === resourceType &&
            node.data.parent === syncNode.data.id,
        );
      }

      // Find the specific resource node under the resourceType node by resourceName
      if (resourceTypeNode && resourceName) {
        specificResourceNode = elements.nodes.find(
          (node) =>
            node.data.name === resourceName &&
            node.data.parent === resourceTypeNode.data.id,
        );
      }

      // If the specific resource node is found and contains the specified property, return its value
      if (
        specificResourceNode &&
        specificResourceNode.data[property] !== undefined
      ) {
        return specificResourceNode.data[property];
      }

      return undefined; // Return undefined if the reference cannot be resolved
    }

    function traceAndOrganizeInitResources(
      clusters,
      inits,
      resourceTypes,
      resources,
    ) {
      let organizedInitResources = {};
      clusters.forEach((cluster) => {
        organizedInitResources[cluster.name] = {};

        // Find inits that are children of the current cluster
        const clusterInits = inits.filter((init) => init.parent === cluster.id);

        clusterInits.forEach((init) => {
          // Initialize an object for each init
          organizedInitResources[cluster.name][init.name] = {};

          Object.keys(resourceTypes).forEach((typeName) => {
            // Find resourceTypes that are children of the current init
            const typeResources = resourceTypes[typeName].filter(
              (type) => type.parent === init.id,
            );

            typeResources.forEach((type) => {
              // Now, find resources that are children of the current resourceType
              const typeSpecificResources = resources.filter(
                (resource) => resource.parent === type.id,
              );

              if (typeSpecificResources.length > 0) {
                // Ensure there's an array to hold resources of this type under the init
                if (
                  !organizedInitResources[cluster.name][init.name][typeName]
                ) {
                  organizedInitResources[cluster.name][init.name][typeName] =
                    [];
                }
                // Add the found resources to the array
                organizedInitResources[cluster.name][init.name][typeName].push(
                  ...typeSpecificResources,
                );
              }
            });
          });
        });
      });
      return organizedInitResources;
    }

    // Assuming 'elements' is your dataset
    resolveNodeReferences(
      elements,
      (envName, appName, resourceType, resourceName, property) => {
        // This callback now correctly aligns with the parameters extracted by the regex within resolveNodeReferences
        return lookupReference(
          envName,
          appName,
          resourceType,
          resourceName,
          property,
          elements,
        );
      },
    );
    // Process clusters
    clusters.forEach((cluster) => {
      const organizedInit = traceAndOrganizeInitResources(
        clusters,
        inits,
        resourceTypes,
        resources,
      );

      let envsMetadata = []; // This will collect metadata for all environments within the cluster
      let envsManifest = {};
      // let clustersMetadata = []; // This will collect metadata for all environments within the cluster
      // let clustersManifest = {};
      let edgesFromCluster = edges.filter((edge) => edge.source === cluster.id);
      let connectedK8s = [];
      let connectedManifestRepos = [];
      let connectedMetadataRepos = [];

    k8s.forEach((k8s) => {
      const foundEdge = edgesFromCluster.find(
        (edgeFromCluster) => edgeFromCluster.target === k8s.id
      );

      if (foundEdge) {
        connectedK8s.push(
          cy.getElementById(foundEdge.target)
        );
      }
    });
      // k8s.forEach((k8s) => {
      //   connectedK8s.push(
      //     cy.getElementById(
      //       edgesFromCluster.find(
      //         (edgeFromCluster) => edgeFromCluster.target === k8s.id,
      //       ).target,
      //     ),
      //   );
      // });
      manifest_repos.forEach((repo) => {
        connectedManifestRepos.push(
          cy.getElementById(
            edgesFromCluster.find(
              (edgeFromCluster) => edgeFromCluster.target === repo.id,
            ).target,
          ),
        );
      });
      metadata_repos.forEach((repo) => {
        connectedMetadataRepos.push(
          cy.getElementById(
            edgesFromCluster.find(
              (edgeFromCluster) => edgeFromCluster.target === repo.id,
            ).target,
          ),
        );
      });
      server = connectedK8s?.[0]?.data("server");
      argo_ns = connectedK8s?.[0]?.data("argo_ns");

      manifest_repo = connectedManifestRepos?.[0]?.data("url");
      metadata_repo = connectedMetadataRepos?.[0]?.data("url");
      manifestRevision = connectedManifestRepos?.[0]?.data("revision");
      metadataRevision = connectedMetadataRepos?.[0]?.data("revision");
      // environments.find(env => env.id === workflowToEnvEdge.target).name

      // Handling workflow_types and workflows with detailed properties
      const workflowsData = workflow_types
        .filter((wt) => wt.parent === cluster.id)
        .map((wt) => {
          let wf_yaml = {};
          // let connectedES;

          // Mapping each workflow to include all of its properties or a selected subset
          workflows.forEach((workflow) => {
            if (workflow.parent === wt.id) {
              let workflowToEnvEdge = edges.find(
                (edge) => edge.source === workflow.id,
              );
              if (workflowToEnvEdge) {
                wf_yaml = generateWorkflowYaml(
                  cluster.name,
                  workflow,
                  templateTypes,
                  dagNodes,
                  tasks,
                  templates,
                  workflowToEnvEdge,
                );
                // console.log(`YAML for Workflow ${workflow.name}:`, yamlString);
              }
            }
          });

          const wfs = workflows
            .filter((w) => w.parent === wt.id)
            .map((w) => {
              // w.wf = JSON.parse(JSON.stringify(wf_yaml));
              // Example of including all properties of the workflow
              const es_wf = es.find((es) => es.parent == w.id);
              return {
                id: w.id,
                prefix: es_wf.prefix,
                resource: es_wf.resource,
                wf: JSON.parse(JSON.stringify(wf_yaml)),
                filter: es_wf.filter,
                parameters: w.parameters,
                name: w.name,
              };
            });

          return {
            id: wt.id,
            type: wt.name,
            wfs: wfs, // List of workflows with their detailed properties
          };
        });
      const envs = environments
        .filter((env) => env.parent === cluster.id)
        .map((env) => {
          if (clusterEnvConnections[cluster.id]) {
            clusterEnvConnections[cluster.id].forEach((envId) => {
              // Find the environment regardless of its cluster
              const connectedEnv = environments.find((env) => env.id === envId);
              if (connectedEnv) {
                // Find the cluster of the connected environment
                const connectedEnvCluster = clusters.find(
                  (c) => c.id === connectedEnv.parent,
                );
                if (connectedEnvCluster) {
                  // Assuming you want to add a 'pfops' entry for each connected environment
                  // Adjust the structure here as needed. This example directly sets or updates 'pfops'.
                  envsManifest["pfops"] = {
                    // Now correctly referencing the cluster of the connected environment
                    cluster: connectedEnvCluster.name, // This is the cluster of the connected environment
                    env: connectedEnv.name, // This is the connected environment
                  };
                }
              }
            });
          }
          Object.assign(envsManifest, {
            repo: metadata_repo,
            revision: metadataRevision,
          });

          const appsMetadata = applications
            .filter((app) => app.parent === env.id)
            .map((app) => {
              // Initialize structures to hold organized resources for each app
              let organizedResources = {
                PreSync: {},
                Sync: {},
                PostSync: {},
              };

              // Function to trace and organize resources up to their corresponding app
              const traceAndOrganizeResources = (stageResources, stageName) => {
                Object.keys(stageResources).forEach((resourceTypeKey) => {
                  const resourceTypeArray = stageResources[resourceTypeKey];
                  resourceTypeArray.forEach((resourceType) => {
                    // Assuming 'resourceType' now refers to the ResourceType node and you need to find the actual resources under it
                    // Fetch the resources that belong to this resourceType and stage
                    const resourcesForTypeAndStage = resources.filter(
                      (resource) =>
                        resource.parent === resourceType.id && // Resource is a child of ResourceType
                        resource.enabled !== "false" && // Only include resources that are not explicitly disabled
                        [...preSyncs, ...syncs, ...postSyncs].find(
                          (stage) =>
                            stage.id === resourceType.parent &&
                            stage.parent === app.id,
                        ), // ResourceType is a child of a stage (PreSync/Sync/PostSync) which is a child of an app
                    );

                    // Check if there are resources to organize under this type and stage
                    if (resourcesForTypeAndStage.length > 0) {
                      if (!organizedResources[stageName][resourceTypeKey]) {
                        organizedResources[stageName][resourceTypeKey] = [];
                      }
                      // Organize the fetched resources
                      organizedResources[stageName][resourceTypeKey].push(
                        ...resourcesForTypeAndStage.map((resource) => {
                          // Check if the resource has secret data that needs to be encoded
                          if (
                            resource.data &&
                            typeof resource.data === "object" &&
                            resourceTypeKey === "secrets"
                          ) {
                            // Iterate over each key-value pair in the data map
                            Object.keys(resource.data).forEach((key) => {
                              // Encode the value part of the key-value pair
                              resource.data[key] = resource.data[key];
                              // resource.data[key] = btoa(resource.data[key]);
                            });
                          }
                          // Return the resource with any modifications made
                          return {
                            ...resource,
                            // id: resource.id,
                            // name: resource.name,
                            // Include other properties as needed
                          };
                        }),
                      );
                    }
                  });
                });
              };
              // Assuming you have a way to filter resources by stage (PreSync, Sync, PostSync) for the current app
              // For each stage, you would have already filtered or have a mechanism to get the resources belonging to that stage and app
              // Here's an illustrative approach on how you might trace resources for each stage
              Object.keys(resourceTypes).forEach((typeKey) => {
                const preSyncResourcesForType = resourceTypes[typeKey].filter(
                  (resource) =>
                    preSyncs.find(
                      (ps) => ps.parent === app.id && resource.parent === ps.id,
                    ),
                );
                const syncResourcesForType = resourceTypes[typeKey].filter(
                  (resource) =>
                    syncs.find(
                      (s) => s.parent === app.id && resource.parent === s.id,
                    ),
                );
                const postSyncResourcesForType = resourceTypes[typeKey].filter(
                  (resource) =>
                    postSyncs.find(
                      (ps) => ps.parent === app.id && resource.parent === ps.id,
                    ),
                );

                traceAndOrganizeResources(
                  { [typeKey]: preSyncResourcesForType },
                  "PreSync",
                );
                traceAndOrganizeResources(
                  { [typeKey]: syncResourcesForType },
                  "Sync",
                );
                traceAndOrganizeResources(
                  { [typeKey]: postSyncResourcesForType },
                  "PostSync",
                );
              });

              const dependsOnData = globalAppDependencies[app.id]
                ? globalAppDependencies[app.id]
                    .map((depId) => {
                      const depApp = globalApplications[depId];
                      return depApp
                        ? {
                            app: depApp.name,
                            env: depApp.envName,
                            cluster: depApp.clusterName,
                            sync_wave: "0", // Adjust as needed
                          }
                        : null;
                    })
                    .filter((dep) => dep !== null)
                : [];

              // Handling depends_on for PreSync
              if (dependsOnData.length > 0) {
                // Directly add depends_on at the PreSync level
                if (
                  !organizedResources["PreSync"].hasOwnProperty("depends_on")
                ) {
                  organizedResources["PreSync"]["depends_on"] = [
                    {
                      apps: dependsOnData.map((dep) => dep.app),
                      sync_wave:
                        dependsOnData.length > 0
                          ? dependsOnData[0].sync_wave
                          : "0", // Assuming all have the same sync_wave
                      env:
                        dependsOnData.length > 0 ? dependsOnData[0].env : null, // Assuming all are in the same env
                      cluster:
                        dependsOnData.length > 0
                          ? dependsOnData[0].cluster
                          : null, // Assuming all are in the same env
                    },
                  ];
                }
              }
              return {
                id: app.id,
                name: app.name,
                repo: manifest_repo,
                revision: manifestRevision,
                server: server,
                override_na: "false",
                enabled: "true",
                sync_wave: "0",
                resources: organizedResources, // Assuming this is filled with your actual resources logic
              };
            });

          // Add this environment's data to the collection
          // envsManifest.push(envManifest);
          envsMetadata.push({
            id: env.id,
            name: env.name,
            labels: env.labels,
            default_ns: env.default_ns,
            repo: manifest_repo,
            revision: manifestRevision,
            apps: {
              manifest: {
                repo: metadata_repo,
                revision: metadataRevision,
                server: server,
              }, // Assuming you'll populate or modify this as needed
              metadata: appsMetadata,
            },
          });
        });

      // After processing each cluster, add its data to the clusters' manifest and metadata
      graphData.clusters.manifest = {
        name: "synops",
        repo: metadata_repo,
        revision: metadataRevision,
        server: server,
        namespace: argo_ns,
        // Include any manifest details specific to the cluster here
      };

      graphData.clusters.metadata.push({
        id: cluster.id,
        name: cluster.name,
        repo: manifest_repo,
        revision: manifestRevision,
        server: server,
        labels: cluster.labels,
        init: organizedInit[cluster.name].init, // Assuming organizedInit is structured correctly
        workflow: workflowsData, // Ensure workflowsData is defined and structured correctly
        envs: {
          manifest: envsManifest, // Make sure envsManifest is structured correctly as an object
          metadata: envsMetadata, // envsMetadata is an array of environment metadata
        },
      });
    });

    if (jsonOutput) return graphData;
    // Convert the graphData object to YAML
    else return jsyaml.dump(graphData);
  }

  function extractParamsWithComparison(
    original,
    desired,
    parentKey = "",
    depth = 0,
    results = { nodesAdded: [], nodesRemoved: [], nodesModified: [] },
  ) {
    // From original to desired (Removed and Modified)
    compareOriginalToDesired(original, desired, parentKey, depth, results);

    // From desired to original (Added)
    compareDesiredToOriginal(original, desired, parentKey, depth, results);

    return results;
  }

  function compareOriginalToDesired(
    obj,
    comparisonObj,
    parentKey,
    depth,
    results,
  ) {
    if (typeof obj === "object" && obj !== null) {
      if ("id" in obj) {
        // Logic to process a single node (similar to your existing logic)
        processSingleNode(obj, comparisonObj, parentKey, results);
      }
      // Recursively compare nested objects and arrays
      Object.keys(obj).forEach((key) => {
        if (obj[key] && typeof obj[key] === "object") {
          const nextComparisonObj =
            comparisonObj && comparisonObj[key] ? comparisonObj[key] : {};
          compareOriginalToDesired(
            obj[key],
            nextComparisonObj,
            key,
            depth + 1,
            results,
          );
        }
      });
    }
  }

  function compareDesiredToOriginal(
    original,
    desired,
    parentKey,
    depth,
    results,
  ) {
    if (typeof desired === "object" && desired !== null) {
      if (
        "id" in desired &&
        (!original || !(original["id"] === desired["id"]))
      ) {
        // If the node is present in desired but not in original, it's considered added
        if (!original || !("id" in original)) {
          results.nodesAdded.push({ id: desired["id"], parent: parentKey });
        }
      }
      // Recursively compare nested objects and arrays
      Object.keys(desired).forEach((key) => {
        if (desired[key] && typeof desired[key] === "object") {
          const nextOriginal = original && original[key] ? original[key] : {};
          compareDesiredToOriginal(
            nextOriginal,
            desired[key],
            key,
            depth + 1,
            results,
          );
        }
      });
    }
  }

  function processSingleNode(obj, comparisonObj, parentKey, results) {
    const comparisonParams =
      comparisonObj && "id" in comparisonObj ? comparisonObj : {};
    let idComparisonResult = {
      id: obj["id"],
      parent: parentKey,
      differences: [],
    };

    Object.keys(obj).forEach((key) => {
      if (key !== "id" && !containsId(obj[key])) {
        const originalValue = obj[key];
        const comparisonValue =
          comparisonParams[key] || "Not present in desired data";
        if (JSON.stringify(originalValue) !== JSON.stringify(comparisonValue) && comparisonValue != "Not present in desired data") {
          idComparisonResult.differences.push({
            key: key,
            original: originalValue,
            desired: comparisonValue,
          });
        }
      }
    });

    if (idComparisonResult.differences.length > 0) {
      if (!comparisonObj || !("id" in comparisonObj)) {
        results.nodesRemoved.push(idComparisonResult);
      } else {
        results.nodesModified.push(idComparisonResult);
      }
    }
  }

  function containsId(obj) {
    if (typeof obj === "object" && obj !== null && "id" in obj) {
      return true;
    }
    if (Array.isArray(obj)) {
      return obj.some(containsId);
    }
    if (obj && typeof obj === "object") {
      return Object.values(obj).some(containsId);
    }
    return false;
  }

  function formatComparisonResults(results) {
    let formattedHtml = "";

    // Function to format differences, if any
    const formatDifferences = (differences) => {
      return differences
        .map(
          (diff) =>
            `<div class="key">${diff.key}:</div> <div>Original: ${JSON.stringify(diff.original)}, Desired: ${JSON.stringify(diff.desired)}</div>`,
        )
        .join("\n");
    };

    // Formatting added nodes
    if (results.nodesAdded.length > 0) {
      formattedHtml += '<div class="added">Nodes Added:</div>';
      results.nodesAdded.forEach((node) => {
        formattedHtml += `<div>ID: ${node.id} (Parent: ${node.parent})</div>`;
        // Added nodes might not have differences in the same way as modified nodes
        if (node.differences && node.differences.length > 0) {
          formattedHtml += formatDifferences(node.differences) + "\n";
        }
      });
    }

    // Formatting removed nodes
    if (results.nodesRemoved.length > 0) {
      formattedHtml += '<div class="removed">Nodes Removed:</div>';
      results.nodesRemoved.forEach((node) => {
        formattedHtml += `<div>ID: ${node.id} (Parent: ${node.parent})</div>`;
        // Removed nodes might not have detailed differences
        if (node.differences && node.differences.length > 0) {
          formattedHtml += formatDifferences(node.differences) + "\n";
        }
      });
    }

    // Formatting modified nodes
    if (results.nodesModified.length > 0) {
      formattedHtml += '<div class="modified">Nodes Modified:</div>';
      results.nodesModified.forEach((node) => {
        formattedHtml += `<div>ID: ${node.id} (Parent: ${node.parent})</div>`;
        formattedHtml += formatDifferences(node.differences) + "\n";
      });
    }

    return `<div class="comparisonResult">${formattedHtml}</div>`;
  }

  function splitAndDownloadYAML(originalYamlStr) {
    // Parse the original YAML string into an object using js-yaml
    const originalObject = jsyaml.load(originalYamlStr);

    // Extract the manifest part, which will remain unchanged
    const manifest = originalObject.clusters.manifest;

    // Iterate over each cluster in the metadata array
    originalObject.clusters.metadata.forEach((cluster, index) => {
      // Create a new object for each cluster, including the manifest
      const newObject = {
        clusters: {
          manifest: manifest,
          metadata: [cluster], // Wrap the current cluster in an array
        },
      };

      // Convert the new object back into a YAML string using js-yaml
      const newYamlStr = jsyaml.dump(newObject);

      // Use the download function to download the YAML file
      // Customize the file name for each cluster
      downloadYAML(newYamlStr, `cluster_${cluster.name}_${index + 1}.yaml`);
    });
  }

  // Adjust the downloadYAML function to accept a fileName parameter
  function downloadYAML(yamlStr, fileName) {
    const blob = new Blob([yamlStr], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "graph.yaml"; // Use the provided file name or default
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function displayAppProperties(filterType) {
    // Assuming you have a way to access application properties by appId
    // This is a placeholder for your implementation
    console.log(`Display properties for app with ID: ${filterType}`);
    // Update the UI here based on the application's properties
  }

  function displayProperties(node) {
    const propertiesList = document.getElementById("propertiesList");
    propertiesList.innerHTML = ""; // Clear previous properties

    Object.keys(node.data()).forEach((key) => {
      // if (key !== 'id') { // Skip the id
      const div = document.createElement("div");
      let value = node.data(key) !== undefined ? node.data(key) : "";
      let valueStr = value;
      if (typeof value === "object") {
        // For objects and arrays, convert to a JSON string for editing
        valueStr = JSON.stringify(value, null, 2); // Beautify the JSON string
      }
      div.innerHTML = `<label>${key}:</label><textarea data-key="${key}">${valueStr}</textarea>`;
      propertiesList.appendChild(div);
      // }
    });

    document.getElementById("propertiesPanel").style.display = "block"; // Show the panel

    document
      .querySelectorAll("#propertiesList textarea")
      .forEach((textarea) => {
        textarea.addEventListener("input", function (e) {
          const cursorPosition = e.target.selectionStart;
          const textBeforeCursor = e.target.value.substring(0, cursorPosition);

          // Identify the last significant character and its position
          const lastHashIndex = textBeforeCursor.lastIndexOf("#");
          const lastDotIndex = textBeforeCursor.lastIndexOf(".");
          const lastColonIndex = textBeforeCursor.lastIndexOf(":"); // Add ':' as a significant character for resourceName

          if (lastHashIndex > lastDotIndex && lastHashIndex > lastColonIndex) {
            // '#' is the last significant character, indicating an environment context
            showNodes(e.target, "env", null, lastHashIndex);
          } else if (
            lastDotIndex > lastHashIndex &&
            lastDotIndex > lastColonIndex
          ) {
            // '.' is the last significant character, indicating either an application or resource type context
            const contextString = textBeforeCursor.substring(
              lastHashIndex + 1,
              lastDotIndex,
            );
            const contextParts = contextString.split(".");

            if (contextParts.length === 1) {
              // Only an environment ID is present; show applications related to this environment
              const envId = contextParts[0];
              showNodes(e.target, "app", envId, lastDotIndex);
            } else if (contextParts.length === 2) {
              // Both environment and application IDs are present; show resource types related to this application
              const appId = contextParts[1];
              showNodes(e.target, "resourceType", appId, lastDotIndex);
            }
          } else if (lastColonIndex > lastDotIndex) {
            // ':' is the last significant character, indicating a resource name context
            // Extract the substring that potentially contains the environment, application IDs, and resource type ID
            const contextString = textBeforeCursor.substring(
              lastHashIndex + 1,
              lastColonIndex,
            );
            const contextParts = contextString.split(".");

            if (contextParts.length === 3) {
              // Environment, application IDs, and resource type ID are present; show resource names related to this resource type
              const selectedResourceTypeId = contextParts[2];
              showNodes(
                e.target,
                "resource",
                selectedResourceTypeId,
                lastColonIndex,
              );
            }
          }
        });
      });
  }

  // Add new property functionality
  document.getElementById("addProperty").addEventListener("click", function () {
    const propertiesList = document.getElementById("propertiesList");
    const div = document.createElement("div");
    div.innerHTML = `<label>New Key:</label><input type="text" value="" class="new-key"><label>Value:</label><textarea class="new-value"></textarea>`;
    propertiesList.appendChild(div);
  });

  // Save properties functionality`
  document
    .getElementById("saveProperties")
    .addEventListener("click", function () {
      const node = cy.$(":selected");
      if (node.nonempty()) {
        document
          .querySelectorAll("#propertiesList textarea[data-key]")
          .forEach((textarea) => {
            let key = textarea.getAttribute("data-key");
            let valueStr = textarea.value;
            let value;
            let hasDefaultNs = false;
            if (key === "cy_lock")
              if (valueStr === "true") node.lock();
              else node.unlock();

            if (node.data("cy_type") === "resource") {
              let resTypeNode = node.parent();
              let syncNode =
                resTypeNode.length > 0 ? resTypeNode.parent() : null;
              let appNode = syncNode.length > 0 ? syncNode.parent() : null;

              // Then, find the 'app' node's parent 'env' node
              let envNode = appNode.length > 0 ? appNode.parent() : null;

              // Check if the 'env' node has 'default_ns: true'
              if (envNode && envNode.data("default_ns") === "true") {
                hasDefaultNs = true;
              }
            }

            if (valueStr === "" || (key === "ns" && hasDefaultNs)) {
              node.removeData(key);
            } else {
              try {
                // Attempt to parse the string as JSON to handle objects and arrays
                value = JSON.parse(valueStr);
              } catch (e) {
                // If parsing fails, keep the string as-is
                value = valueStr;
              }
              node.data(key, convertValueToString(value));
            }
          });
        // Add new properties
        document
          .querySelectorAll("#propertiesList .new-key")
          .forEach((input, index) => {
            let key = input.value;
            let value = document.querySelectorAll("#propertiesList .new-value")[
              index
            ].value;
            if (key) {
              // Avoid adding empty keys
              if (value === "") {
                node.removeData(key);
              } else node.data(key, convertValueToString(value));
            }
          });

        // Optionally, hide the panel after saving
        // document.getElementById('propertiesPanel').style.display = 'none';
      }
    });

  function convertValueToString(value) {
    if (Number.isInteger(value) || typeof value === "boolean") {
      return value.toString();
    }
    return value;
  }

  // function convertIntegerToString(value) {
  //   if (Number.isInteger(value)) {
  //     return value.toString();
  //   }
  //   return value;
  // }

  document.getElementById("exportYAML").addEventListener("click", function () {
    const yamlStr = toYaml(cy);
    // downloadYAML(yamlStr);
    splitAndDownloadYAML(yamlStr);
  });

  // Assuming `cy` is your Cytoscape instance

  document
    .getElementById("exportGraphBtn")
    .addEventListener("click", function () {
      const exportedGraphString = exportGraph(cy);
      // console.log(exportedGraphString); // For demonstration, logging the exported string

      // Optionally, trigger a download of the exported graph
      const blob = new Blob([exportedGraphString], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "exportedGraph.json";
      document.body.appendChild(a); // Required for Firefox
      a.click();
      a.remove();
    });

  document
    .getElementById("importGraphBtn")
    .addEventListener("click", function () {
      document.getElementById("importGraphFile").click(); // Trigger file input
    });

  document
    .getElementById("importGraphFile")
    .addEventListener("change", function (event) {
      const fileReader = new FileReader();
      fileReader.onload = function (e) {
        try {
          const fileContent = e.target.result;
          importGraph(cy, fileContent);
          // notifyUser('Graph imported successfully!');
        } catch (error) {
          console.error("Failed to import graph:", error);
          // notifyUser('Failed to import graph. Please check the file format.');
        }
      };
      fileReader.onerror = () => notifyUser("Error reading file.");
      fileReader.readAsText(event.target.files[0]);
    });

  document.getElementById("reviewYAML").addEventListener("click", function () {
    // Generate YAML content here
    const desireYamlContent = toYaml(cy, true);
    const originalYamlContent = toYaml(cy_original, true);

    // Assuming extractParamsWithComparison returns the structured comparison results
    const comparisonResults = extractParamsWithComparison(
      originalYamlContent,
      desireYamlContent,
    );

    // Format the structured comparison results for display
    const formattedYamlComparison = formatComparisonResults(comparisonResults);

    // Set the content in the code block
    var codeBlock = document.getElementById("yamlContent");
    codeBlock.innerHTML = formattedYamlComparison; // Use innerHTML to insert the HTML content

    // Show the modal
    document.getElementById("yamlModal").style.display = "block";
  });

  document
    .getElementById("generateYAML")
    .addEventListener("click", function () {
      // Generate YAML content here
      // This is a placeholder for the actual YAML generation logic
      const yamlContent = toYaml(cy);

      // Set the content in the code block
      var codeBlock = document.getElementById("yamlContent");
      codeBlock.textContent = yamlContent; // Use textContent to safely set the text

      // Manually trigger Prism.js to highlight the code block
      Prism.highlightElement(codeBlock);

      // Show the modal
      document.getElementById("yamlModal").style.display = "block";
    });
  document.getElementById("submitYAML").addEventListener("click", function () {
    // Here, you would add the logic to push the YAML content to a repo
    console.log("Submitting YAML...");

    // Close the modal
    document.getElementById("yamlModal").style.display = "none";
  });

  document.getElementById("cancelYAML").addEventListener("click", function () {
    // Close the modal without doing anything
    document.getElementById("yamlModal").style.display = "none";
  });

  document
    .getElementById("chat-input")
    .addEventListener("keypress", async function (event) {
      if (event.key === "Enter") {
        const message = this.value.trim();
        if (message) {
          // Display the user's message in the chat area
          displayMessage(message, "user");

          // Clear the input box
          this.value = "";

          const graphData = cy.json().elements; // This gets the current state of the graph
          updateGraphOnBackend(graphData);
          // Send the message to your backend
          try {
            const response = await fetch("http://localhost:3000/send-message", {
              // Updated URL
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ message: message }),
            });

            if (response.ok) {
              const data = await response.json();
              // Display the response from the backend (e.g., Dialogflow) in the chat area
              displayMessage(data.reply, "bot");
            } else {
              console.error("Error from backend", await response.text());
              // Optionally, display an error message in the chat area
              displayMessage(
                "Sorry, there was an error processing your message.",
                "bot",
              );
            }
          } catch (error) {
            console.error("Failed to send message to backend:", error);
            // Optionally, display an error message in the chat area
            displayMessage(
              "Sorry, there was an error processing your message.",
              "bot",
            );
          }
        }
        event.preventDefault();
      }
    });

  document
    .getElementById("minimize-chat")
    .addEventListener("click", function () {
      var chatMessages = document.getElementById("chat-messages");
      var chatInput = document.getElementById("chat-input");
      var chatBox = document.getElementById("chat-box");

      // Check if the chatbox is currently minimized
      if (this.textContent === "+") {
        // If minimized, then expand it to its normal size
        chatMessages.style.display = "block";
        chatInput.style.display = "block";
        chatBox.style.height = "400px"; // Adjust this value based on your normal chatbox size
        this.textContent = "-";
      } else {
        // If not minimized, then minimize it
        chatMessages.style.display = "none";
        chatInput.style.display = "none";
        chatBox.style.height = "50px"; // Adjust this value based on your desired minimized chatbox size
        this.textContent = "+";
      }
    });

  function displayMessage(message, sender) {
    const chatMessages = document.getElementById("chat-messages");
    const messageElement = document.createElement("div");

    // Sanitize the message if necessary
    // For this example, we're directly assigning textContent which is generally safe
    messageElement.textContent = `[${sender.toUpperCase()}]: ${message}`;

    // Use CSS classes for styling instead of direct style manipulation
    messageElement.classList.add(
      sender === "user" ? "user-message" : "bot-message",
    );

    // Improve accessibility by adding an aria-label
    messageElement.setAttribute("role", "listitem");
    messageElement.setAttribute(
      "aria-label",
      `${sender === "user" ? "User" : "Bot"} says ${message}`,
    );

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
  }

  // In your frontend JavaScript
  function updateGraphOnBackend(graphData) {
    fetch("http://localhost:3000/api/update-graph", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graphData),
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  const socket = io("http://localhost:3000"); // Use your server URL

  socket.on("dialogflowUpdate", async (data) => {
    console.log("Data received from Dialogflow:", data);
    displayMessage("start processing", "bot");
    try {
      // Call your processing function
      const processingResult = await processData(data);

      // Emit an event back to the backend with the processing result
      socket.emit("frontendProcessed", processingResult);
    } catch (error) {
      console.error("Error processing data:", error);
      // Emit an event back to the backend indicating the error
      socket.emit("frontendProcessed", {
        status: "error",
        details: error.message,
      });
    }
  });
  async function processData(data) {
    // Simulate a processing time
    // await new Promise(resolve => setTimeout(resolve, 1000)); // Remove this line if you have actual processing

    // Return a status or result if needed
    // return { status: 'completed', details: 'Data processed successfully' };
    // const applicationName = data.applicationname || "default";
    // const clusterName = data.clustername || "default";
    // const envName = data.envname || "default";
    // const versionNumber = data.versionnumber || "default";
    // before you can update the 'helm' data on the resource node.

    // Now, call the function to update the graph
    // Since the actual graph update logic is synchronous, you don't need to await it,
    // but you're doing so within the context of an async function
    const result = await updateGraphForApplication(cy, data);
    return result;
  }

  async function updateGraphForApplication(cy, data) {
    let response = { status: "failed", message: "", data: null };

    // const applicationNodes = cy
    //   .nodes()
    //   .filter(
    //     (n) =>
    //       n.data("name") === data.applicationName &&
    //       n.data("cy_type") === "app",
    //   );

      const applicationNodes = cy.nodes().filter(n => {
        const isAppNameMatch = n.data('name') === data.applicationName && n.data('cy_type') === 'app';
        if (!isAppNameMatch) {
          return false; // If the application name does not match, no need to proceed further
        }
        let matchesEnv = false; // Assume match if no envName is provided
        let matchesCluster = false; // Assume match if no clusterName is provided

        const envNode = cy.getElementById(n.data('parent')); // Get the parent environment node
        if (data.envName!=='undefined') {
          matchesEnv = envNode.data('name') === data.envName;
        } else
          matchesEnv = true;
        if (data.clusterName!=='undefined') {
          const clusterNode = cy.getElementById(envNode.data('parent')); // Get the parent cluster node
          matchesCluster = clusterNode.data('name') === data.clusterName;
        } else
          matchesCluster = true;

        return matchesEnv && matchesCluster;
      });

    if (applicationNodes.length > 1) {
      // Handle multiple applications across clusters or environments
      let clustersAndEnvs = applicationNodes.map((appNode) => {
        const envNode = cy.getElementById(appNode.data("parent"));
        const clusterNode = cy.getElementById(envNode.data("parent"));

        return {
          cluster: clusterNode.data("name"),
          env: envNode.data("name"),
        };
      });

      response = {
        status: "choose_application",
        message:
          "Multiple applications found across different clusters or environments. Please select the appropriate one:",
        data: clustersAndEnvs,
      };
    } else if (applicationNodes.length === 1) {
      // Handle a single application node
      const appNode = applicationNodes[0];
      // Directly target the sync node under the application
      const syncNode = appNode
        .descendants()
        .filter((n) => n.data("cy_type") === "sync")
        .first();
      // Directly target the charts node under the sync node
      const chartsNode = syncNode
        .descendants()
        .filter((n) => n.data("cy_type") === "charts")
        .first();
      // Collect all resource nodes under the charts node
      const resourceNodes = chartsNode
        .descendants()
        .filter((n) => n.data("cy_type") === "resource");

      if (resourceNodes.length > 1) {
        // Handle multiple resource nodes
        let resourcesInfo = resourceNodes.map((node) => {
          // return {
          //   name: node.data('name'),
          // };
          return node.data("name");
        });

        response = {
          status: "choose_resource",
          message:
            "Multiple resources found under the application. Please select the right one to upgrade:",
          data: resourcesInfo,
        };
      } else if (resourceNodes.length === 1) {
        // Handle exactly one resource node
        // Include logic for updating and flashing the node here
        updateAndFlashResourceNode(resourceNodes);
        updateHelmRevisionForResourceNode(resourceNodes, data.versionNumber);
        response = {
          status: "completed",
          message: "Data processed successfully.",
        };
      } else {
        // No resource nodes found under the application
        response = {
          status: "failed",
          message: "No resource nodes found under the selected application.",
          data: null,
        };
      }
    } else {
      // No applications found
      response = {
        status: "failed",
        message: "No applications found matching the criteria.",
        data: null,
      };
    }

    return response;
  }
  // Example stub for the update and flash logic
  function updateAndFlashResourceNode(resourceNode) {
    // Logic to update the resource node
    // Flash the node to indicate it's been updated
    flashNodeBackground(resourceNode, 3000); // Assuming flashNodeBackground is defined elsewhere
  }

  function updateHelmRevisionForResourceNode(resourceNode, versionNumber) {
    // Retrieve the current helm data from the node
    const helmData = resourceNode.data("helm");

    if (!helmData) {
      console.error("Helm data not found for the resource node.");
      return {
        status: "failed",
        message: "Helm data not found for the resource node.",
      };
    }

    // Update the revision in the helm data
    const updatedHelmData = { ...helmData, revision: versionNumber };

    // Set the updated helm data back to the node
    resourceNode.data("helm", updatedHelmData);

    console.log("Helm revision updated successfully.");
    return {
      status: "completed",
      message: "Helm revision updated successfully.",
      data: updatedHelmData,
    };
  }

  function flashNodeBackground(node, duration = 3000) {
    let originalColor = node.style("background-color"); // Store the original color
    let highlightColor = "red"; // Color used to flash
    let flashing = true;

    // Function to toggle the node color
    const toggleColor = () => {
      node.style("background-color", flashing ? highlightColor : originalColor);
      flashing = !flashing; // Toggle the flashing state
    };

    // Start the flashing effect
    let intervalId = setInterval(toggleColor, 500);

    // Stop flashing after the specified duration
    setTimeout(() => {
      clearInterval(intervalId); // Stop the interval
      node.style("background-color", originalColor); // Reset to original color
    }, duration);
  }
  // // Example async function to simulate fetching helm update info
  // async function fetchHelmUpdateInfo() {
  //   // Simulate a delay to mimic an async API call
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  //   // Return some data
  //   return "new helm value";
  // }
});
