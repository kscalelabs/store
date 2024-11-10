"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FaChevronRight, FaExclamationTriangle } from "react-icons/fa";

import URDFRenderer from "@/components/files/StaticURDFRenderer";
import { parseTar } from "@/components/files/Tarfile";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import Spinner from "@/components/ui/Spinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { components } from "@/gen/api";
import { humanReadableError, useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import stompy from "@/images/stompy.png";
import * as hal_pb from "@/lib/openlch-server-grpc/hal_pb";
import { ServoInfo } from "@/lib/openlch-server-grpc/hal_pb";
import { ServoControlClient } from "@/lib/openlch-server-grpc/hal_pb.client";
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import pako from "pako";
import { URDFJoint } from "urdf-loader";

type SingleArtifactResponse = components["schemas"]["SingleArtifactResponse"];

interface UntarredFile {
  name: string;
  content: Uint8Array;
}

function isIpAddress(input: string): boolean {
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$/;
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:)|(([0-9a-fA-F]{1,4}:){1,7}:)|(([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2})|(([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3})|(([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4})|(([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5})|([0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6}))|(:((:[0-9a-fA-F]{1,4}){1,7}|:))|(::([fF]{4}:)?(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}))$/;

  return ipv4Regex.test(input) || ipv6Regex.test(input) || input == "localhost";
}

const handleLoadAndUntar = async (a: SingleArtifactResponse) => {
  if (!a?.urls?.large) {
    throw new Error("Artifact URL not available.");
  }

  let files = [];
  try {
    const response = await fetch(a.urls.large);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Decompress gzip
    const decompressed = pako.ungzip(uint8Array);

    // Parse tar
    files = parseTar(decompressed);
  } catch {
    throw new Error("Failed to fetch artifacts.");
  }

  return files;
};

interface RobotRendererProps {
  onJointClicked: (joint: URDFJoint) => void;
}

const RobotRenderer = ({ onJointClicked }: RobotRendererProps) => {
  const artifactId = "28a426fd25d70716";
  const [artifact, setArtifact] = useState<SingleArtifactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [untarredFiles, setUntarredFiles] = useState<UntarredFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UntarredFile | null>(null);
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  useEffect(() => {
    (async () => {
      if (!artifactId || artifact) return;

      try {
        const { data, error } = await auth.client.GET(
          "/artifacts/info/{artifact_id}",
          {
            params: { path: { artifact_id: artifactId } },
          },
        );

        if (error) {
          throw error;
        }

        setArtifact(data);
        const files = await handleLoadAndUntar(data);
        setUntarredFiles(files!);
        if (files.length != 0) {
          setSelectedFile(files[0]);
        }
      } catch (err) {
        addErrorAlert(humanReadableError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [auth.client]);

  if (loading) {
    return (
      <div className="flex justify-center items-center pt-8">
        <Spinner />
      </div>
    );
  }

  return artifact?.urls.large
    ? (
      <div className="w-3xl mx-auto px-4 py-8">
        <div className="mb-4 flex flex-col lg:flex-row lg:space-x-4">
          <div className="w-full">
            <div className="border border-gray-300 rounded-md overflow-hidden relative h-[600px]">
              <div className="h-full">
                {selectedFile
                  ? (
                    <URDFRenderer
                      urdfContent={new TextDecoder().decode(
                        selectedFile.content,
                      )}
                      files={untarredFiles}
                      onJointClicked={onJointClicked}
                    />
                  )
                  : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
    : (
      <div className="flex justify-center items-center pt-8">
        <Spinner />
      </div>
    );
};

interface SlideProps {
  onNext: () => void;
  onPrev: () => void;
}

const Intro: React.FC<SlideProps> = ({ onNext }) => {
  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-xl">Stompy Mini</CardTitle>
      </CardHeader>
      <CardContent className="min-h-4">
        <img
          src={stompy}
          alt={"Stompy Robot"}
          className="max-w-full max-h-full object-contain mb-3"
        />
        <p>
          Thanks for getting started with our latest robot!
          <br />
          In the next few moments we'll get your robot assembled, calibrated,
          and ready to walk.
        </p>
      </CardContent>
      <CardFooter className="mt-2">
        <Button className="ml-auto" onClick={onNext}>
          Get Started <FaChevronRight />
        </Button>
      </CardFooter>
    </Card>
  );
};

const Unboxing: React.FC<SlideProps> = ({ onNext, onPrev }) => {
  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-xl">Unboxing</CardTitle>
      </CardHeader>
      <CardContent className="min-h-4">
        <h4 className="my-2">Here's what you can expect to find in your box</h4>
        <Skeleton className="h-60 bg-gray-300 w-full" />
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Mechanical</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-2">
                <li>3D printed parts</li>
                <li>Screws</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Electrical</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-2">
                <li>IMU</li>
                <li>Camera</li>
                <li>Milk-V</li>
                <li>Flashed SD card</li>
                <li>Battery</li>
                <li>Servo Driver</li>
                <li>Servos</li>
                <li>Power Dropdown</li>
                <li>Cables</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter className="py-4">
        <Button className="ml-auto" variant="secondary" onClick={onPrev}>
          Back
        </Button>
        <Button onClick={onNext}>
          Assembly <FaChevronRight />
        </Button>
      </CardFooter>
    </Card>
  );
};

const Assembly: React.FC<SlideProps> = ({ onNext, onPrev }) => {
  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-xl">Assembly</CardTitle>
      </CardHeader>
      <CardContent className="min-h-4">
        <h4 className="my-2">Let's get your robot assembled!</h4>

        <Accordion type="multiple" className="w-full">
          <AccordionItem value="step-1">
            <AccordionTrigger>Step 1: Mechanical Assembly</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-4">
                <li>Gather all 3D printed parts and screws.</li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Begin with the lower body: assemble the ankle, knee, and hip
                  joints.
                </li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Align and secure the 3D printed parts using screws at each
                  joint.
                </li>
                <li>Check for smooth joint movement before proceeding.</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-2">
            <AccordionTrigger>Step 2: Installing Servos</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-4">
                <li>
                  Attach servos to all major joints (e.g., hip, knee, shoulder).
                </li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Refer to the labeled diagram for servo placement
                  (right_shoulder_pitch, left_hip_roll, etc.).
                </li>
                <li>Secure the servo arms using provided screws.</li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Ensure each servo is positioned at its neutral angle for
                  calibration.
                </li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-3">
            <AccordionTrigger>
              Step 3: Installing the IMU and Camera
            </AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-4">
                <li>Mount the IMU on the torso for orientation tracking.</li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Install the camera on the head to ensure the robot has a clear
                  field of vision.
                </li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Connect both components to the main control unit via
                  appropriate cables.
                </li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-4">
            <AccordionTrigger>Step 4: Setting up the Milk-V</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-4">
                <li>Flash the SD card with the correct firmware.</li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>Insert the flashed SD card into the Milk-V.</li>
                <li>
                  Mount the Milk-V securely inside the robot’s control
                  compartment.
                </li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-5">
            <AccordionTrigger>Step 5: Electrical Wiring</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-4">
                <li>Connect the battery to the power dropdown module.</li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Wire the servo driver to the servos following the correct
                  pinout diagram.
                </li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>Route the cables neatly to avoid tangling.</li>
                <li>Ensure all connections are secure and organized.</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-6">
            <AccordionTrigger>Step 6: Power-On and Testing</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-4">
                <li>
                  Turn on the power and ensure the robot receives power from the
                  battery.
                </li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Test each joint’s movement through the servo driver software.
                </li>
                <li>
                  Verify that the IMU and camera are functioning correctly.
                </li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Ensure the Milk-V boots up and runs the correct program.
                </li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-7">
            <AccordionTrigger>Step 7: Final Adjustments</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-4">
                <li>Perform any necessary joint recalibration.</li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>Double-check all screws and wiring.</li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Run a full movement test to ensure the robot operates as
                  expected.
                </li>
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter className="py-4">
        <Button className="ml-auto" variant="secondary" onClick={onPrev}>
          Back
        </Button>
        <Button onClick={onNext}>
          Connect to Robot <FaChevronRight />
        </Button>
      </CardFooter>
    </Card>
  );
};

interface ConnectProps {
  onNext: () => void;
  onPrev: () => void;
  updateRobotUrl: (url: string) => void;
}

const Connect: React.FC<ConnectProps> = ({
  onNext,
  onPrev,
  updateRobotUrl,
}) => {
  const [robotNameOrIp, setRobotNameOrIp] = useState("");
  const [isConnecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  async function connectToRobot() {
    setConnecting(true);
    let server = robotNameOrIp;
    if (!isIpAddress(server)) {
      server = server + ".local";
    }
    server = "http://" + server + ":50051";
    const robotConnection = new ServoControlClient(
      new GrpcWebFetchTransport({ baseUrl: server }),
    );
    updateRobotUrl(server);
    try {
      const { response } = await robotConnection.getPositions(hal_pb.Empty);
      console.log(response);
      onNext();
    } catch (error) {
      setError(error as string);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-xl">Connect to Stompy</CardTitle>
      </CardHeader>
      <CardContent className="min-h-4">
        <Skeleton className="h-60 bg-gray-300 w-full mb-4" />
        <p className="mb-4">
          Please ensure the robot is plugged in via the included USB-C and
          positioned on its stand.
        </p>
        <Input
          className="my-2"
          placeholder="stompy-robot-name"
          onChange={(e) => setRobotNameOrIp(e.target.value)}
        />
        {error != ""
          ? (
            <Alert variant="destructive">
              <FaExclamationTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to connect to stompy. {error.toString()}
              </AlertDescription>
            </Alert>
          )
          : null}
      </CardContent>
      <CardFooter className="mt-2">
        <Button className="ml-auto" variant="secondary" onClick={onPrev}>
          Back
        </Button>
        <Button
          disabled={robotNameOrIp == "" || isConnecting}
          onClick={connectToRobot}
        >
          Connect
        </Button>
      </CardFooter>
    </Card>
  );
};

interface ServoLinkProps {
  robotUrl: string;
  onNext: () => void;
}

const ServoLink: React.FC<ServoLinkProps> = ({ onNext, robotUrl }) => {
  const client = new ServoControlClient(
    new GrpcWebFetchTransport({ baseUrl: robotUrl }),
  );
  const [servos, setServos] = useState<ServoInfo[]>([]);
  const [currentServo, setCurrentServo] = useState<number>(0);
  const [servoMappings, setServoMappings] = useState<Record<number, string>>(
    {},
  );

  useEffect(() => {
    console.log(currentServo);
    const fetchServos = async () => {
      const { response } = await client.scan(hal_pb.Empty);
      let servos = [];
      for (const id of response.ids) {
        const { response } = await client.getServoInfo({ id: id });
        if (response.result.oneofKind === "info") {
          servos.push(response.result.info);
        }
      }
      return servos;
    };

    fetchServos().then((s) => {
      setServos(s);
      if (s.length > 0) {
        setCurrentServo(s[0].id);
      }
    }).catch(console.error);
  }, []);

  const handleJointClicked = (joint: URDFJoint) => {
    setServoMappings({ ...servoMappings, [currentServo]: joint.name });
  };

  const servosReady = servos.length == Object.keys(servoMappings).length;

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-xl">Servo Linking</CardTitle>
      </CardHeader>
      <CardContent className="min-h-4">
        <p className="my-2">
          Select the servo to link, and click on the corresponding robot joint
          that moves on the robot. <br />{" "}
          Once all servos have been assigned joints you may continue to
          calibration.
        </p>
        {servos.map((val, index) => {
          let variant = "ghost";
          let select = false;
          if (val.id in servoMappings) {
            variant = "success";
          }
          if (val.id == currentServo) {
            select = true;
          }
          return (
            <Button
              key={val.id}
              className="mx-1"
              variant={variant}
              outline={select ? "active" : "default"}
              size="sm"
              onClick={() => {
                setCurrentServo(val.id);
              }}
            >
              Servo {index}
            </Button>
          );
        })}

        <RobotRenderer
          onJointClicked={(j) => {
            handleJointClicked(j);
          }}
        />
      </CardContent>
      <CardFooter className="mt-2">
        <Button disabled={!servosReady} className="ml-auto" onClick={onNext}>
          Calibration <FaChevronRight />
        </Button>
      </CardFooter>
    </Card>
  );
};

interface CalibrationProps {
  robotUrl: string;
  onNext: () => void;
}

const Calibration: React.FC<CalibrationProps> = ({ onNext, robotUrl }) => {
  const [isCalibrating, setCalibrating] = useState(false);
  const [isCalibrated, setCalibrated] = useState(false);

  const client = new ServoControlClient(
    new GrpcWebFetchTransport({ baseUrl: robotUrl }),
  );

  const startCalibration = () => {
    // client.startCalibration()
    setCalibrating(true);
  };

  const cancelCalibration = () => {
    // client.cancelCalibration()
    setCalibrating(false);
  };

  useEffect(() => {
    function checkCalibrated() {
      if (isCalibrating) {
        client.getCalibrationStatus(hal_pb.Empty).then(({response}) => {
          setCalibrated(!response.isCalibrating)
        }).catch((e) => console.error(e))
      }
    }
    const id = setInterval(checkCalibrated, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-xl">Calibrating Servos</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          Make sure your robot is placed on the holder, then we'll begin the
          calibration. If the movements on the robot aren't reflected on the
          viewer, please go back and make sure your servos are correctly
          assigned.
        </p>
        <RobotRenderer onJointClicked={(j) => {}} />
        { !isCalibrated ?
           (!isCalibrating
          ? (
            <Button className="w-full my-2" onClick={startCalibration}>
              Start Calibration
            </Button>
          )
          : (
            <Button
              className="w-full my-2"
              variant="destructive"
              onClick={cancelCalibration}
            >
              Cancel Calibration
            </Button>
          ))
          :
          <h2>Calibration Complete</h2>
        }
      </CardContent>
      <CardFooter className="mt-2">
        <Button variant="primary" className="ml-auto" disabled={!isCalibrated} onClick={onNext}>
          Next Steps <FaChevronRight />
        </Button>
      </CardFooter>
    </Card>
  );
};

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [robotUrl, setRobotUrl] = useState("");

  const nextStep = () => setStep((prevStep) => prevStep + 1);
  const prevStep = () => setStep((prevStep) => prevStep - 1);

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return <Intro onNext={nextStep} onPrev={prevStep} />;
      case 2:
        return <Unboxing onNext={nextStep} onPrev={prevStep} />;
      case 3:
        return <Assembly onNext={nextStep} onPrev={prevStep} />;
      case 4:
        return (
          <Connect
            onNext={nextStep}
            onPrev={prevStep}
            updateRobotUrl={setRobotUrl}
          />
        );
      case 5:
        return <ServoLink onNext={nextStep} robotUrl={robotUrl} />;
      case 6:
        return <Calibration onNext={nextStep} robotUrl={robotUrl} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative flex justify-center">
      <div className="max-w-5xl py-4 flex-grow">{renderCurrentStep()}</div>
    </div>
  );
};

export default Onboarding;
