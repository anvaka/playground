
import { ForceDirectedGraph, ForceVisualizer, Node, Shape} from './layout.js';
import * as miserables from 'https://esm.run/miserables';

const mGraph = miserables.create();


// const graph = new ForceDirectedGraph({
//     centerPointWeight: 2.0,     // Center point force multiplier
//     maxEdgeLength: 200,        // Maximum edge length threshold
//     forceDecayRate: 0.5,       // Exponential force decay rate
//     repulsionStrength: 1000,   // Base repulsion strength
//     attractionStrength: 0.5,   // Base attraction strength
//     damping: 0.8,             // Velocity damping factor
//     deltaTime: 0.1            // Integration time step
// });

// Create canvas for visualization
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

// Create graph with visualizer
const graph = new ForceDirectedGraph();
graph.setVisualizer(new ForceVisualizer(canvas));

// Create nodes with different shapes
// const node1 = new Node("1", 0, 0, Shape.Rectangle(50, 50));
// const node2 = new Node("2", 100, 100, Shape.Triangle(60));
// const node3 = new Node("3", -100, 50, Shape.Pentagon(30));

// graph.addNode(node1);
// graph.addNode(node2);
// graph.addNode(node3);

// graph.addEdge(node1, node2, 150);
// graph.addEdge(node2, node3, 150);

mGraph.forEachNode(node => {
    const fNode = new Node(node.id, 
        (0.5 - Math.random()) * 100, 
        (0.5 - Math.random()) * 100, 
        Shape.Triangle(30)
    );
    node.fNode = fNode;

    graph.addNode(fNode);
});

mGraph.forEachLink(link => {
    graph.addEdge(
        mGraph.getNode(link.fromId).fNode,
        mGraph.getNode(link.toId).fNode,
        150
    )
});


// // Animation loop
function animate() {
    graph.step();
    requestAnimationFrame(animate);
}
animate();