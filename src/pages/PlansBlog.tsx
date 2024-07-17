import { Typography } from "@mui/material";
import buildVideo from "../assets/build.mp4";
import testFitVideo from "../assets/testFit.mp4";
import cmsVideo from "../assets/cms.mp4";
import { Flex } from "../components/Flex";
import { useStyles } from "./styles";

export const PlansBlog = () => {
  const classes = useStyles();
  return (
    <>
      <Typography variant="h2" className={classes.header}>
        CBRE Plans Blog
      </Typography>
      <div className={classes.bodyContainer}>
        <Typography variant="body1">
          From 2014 to 2019, I worked at a company called Floored which was
          later acquired by CBRE and renamed CBRE Build. Our initial goal was to
          make 3D visualizations of real estate that you could walk though on
          the web. We made a custom shader in WebGL that could render a
          realistic version of interior and exterior spaces in a performant way
          on the web. We also made tools for talented 3D artists to create these
          spaces.
        </Typography>
        <br />
        <Flex justifyContent="center">
          <video
            autoPlay
            loop
            playsInline
            preload="metadata"
            className={classes.video}
          >
            <source src={buildVideo} type="video/mp4" />
          </video>
        </Flex>
        <br />
        <Typography variant="body1">
          I initially worked on 3D computer vision of point clouds where our
          built-in-house scanner could reconstruct the space into its semantic
          parts (walls, floors, furniture, etc.) Then I moved into the physics
          engine where I implemented a way to collide with walls, furniture, and
          floors so the user could do things like walk up a stairway. I
          implemented a way to generate navigational points to generate
          panoramic images of the rendering for devices with less powerful GPUs.
        </Typography>
        <br />
        <Typography variant="body1">
          Then we came up with a new idea: a way to automatically generate a
          floorplan layout for commercial spaces while still giving the users
          fine-tune controls. Then we leveraged our existing product to extrude
          this 2D floorplan into the 3D rendering that we're known for. We
          called it Protofit, and it was a large reason why we were acquired by
          CBRE. Then we rebranded it to CBRE Plans.
        </Typography>
        <br />
        <Flex justifyContent="center">
          <video
            autoPlay
            loop
            playsInline
            preload="metadata"
            className={classes.video}
          >
            <source src={cmsVideo} type="video/mp4" />
          </video>
        </Flex>
        <br />
        <Typography variant="body1">
          This was the majority of my 5 years at the company. Our stack was
          mithril.js, Node, CouchDb, with Julia running in the backend. We used
          Julia for its speed in linear algebra and optimization. We used
          CouchDb for its ability to store large amounts of data in a schemaless
          way. We used mithril.js because it was a small library that was easy
          to learn. React was still in its infancy, but mithril already had a
          lot of the features that React would eventually have. I was the main
          developer on the frontend and backend of the project, and I learned a
          lot about web development in the process.
        </Typography>
        <Flex justifyContent="center">
          <video
            autoPlay
            loop
            playsInline
            preload="metadata"
            className={classes.video}
          >
            <source src={testFitVideo} type="video/mp4" />
          </video>
        </Flex>
        <br />
        <Typography variant="body1">
          In the Julia backend, I made a numerical optimization algorithm that
          would generate the furniture placement inside an arbitrarily shaped
          room. We would first generate a number of "initial guesses", and then
          using a cost function, improve upon those guesses using a gradient
          descent approach and "walking" towards a minimum cost solution. The
          cost function would take into account the distance between the
          furniture and the walls, the distance between the furniture and other
          furniture, the distance between the furniture and the windows, and the
          distance between the furniture and the doors. It was important that
          each of our polygonal algorithms ran no slower than O(n^2) time
          complexity so the user wouldn't be waiting long for the process to
          complete. Some of the polygons would have hundreds of vertices, so
          this was no small feat.
        </Typography>
        <br />
        <Typography variant="body1">
          We wrote completely custom polygonal functions for things like finding
          the intersection between 2 line segments, or finding the largest
          interior rectangle. There are very simple solutions to this online and
          in research papers, but none dealt with things like floating point
          errors and edge cases like we needed. Two particularly challenging
          problems was finding the boolean operations between 2 polygons
          (intersection, union, difference), and finding the offset of a polygon
          that didn't self-intersect itself or explode small angles into
          oblivion. In the end, we had customized solutions for over a dozen
          different room types from offices to benching to conference rooms to
          cafes. Each with their own set of furniture, rules, and constraints.
        </Typography>
        <br />
      </div>
    </>
  );
};
