Feature: Git Internal Operations
            Description: Understanding Git's core operations and data structures
            Source: git/git source code learning

            @ScenarioCategories
            Navigation:
            | Category  | Scenarios                         | Complexity |
            | Basics    | Object Storage, Simple Commits    | Beginner   |
            | Advanced  | Merging, Rebasing, Cherry-picking | Advanced   |
            | Internals | Hash Objects, Pack Files, Refs    | Expert     |

            @DebugFlows
            Available Flows:
            | Flow Name        | Complexity | Time    | Prerequisites   |
            | Object Storage   | Basic      | 5 mins  | None            |
            | Commit Creation  | Basic      | 8 mins  | Object Storage  |
            | Merge Process    | Advanced   | 10 mins | Commit Creation |
            | Rebase Operation | Advanced   | 15 mins | Merge Process   |

            @DebuggerMetadata
            SessionInfo:
            | Property | Value               |
            | Version  | Git 2.x             |
            | Focus    | Internal Structures |
            | Goal     | Understanding Core  |

    #
    # Scenario 1: Basic Object Storage
    #
    @BasicScenario
    Scenario: Git Object Storage Internals
            Description: "How Git stores content in its object database"

            @DebugSteps
            Flow:
            | Step | Operation             | Focus Point       |
            | 1    | Initialize Structures | Data Setup        |
            | 2    | Create Blobs          | Content Storage   |
            | 3    | Build Tree            | File Organization |
            | 4    | Create Commit         | History Snapshot  |

            @StepOutline
            Step: 1. Initialize Repository Structure
            EntryPoint: "Initialize empty repository"
            """
            # @Section: Repository Setup
            # @CodeBlock: Initial Structure
            repo = {
            "latest_commit": None,
            "refs": {"HEAD": None, "main": None},
            "objects": {}
            }

            # @CodeBlock: Collections Init
            commits = []
            blobs = []
            trees = []
            """
            Variables:
            | Name    | Value                | Type       | Important |
            | repo    | {latest_commit:None} | Dictionary | Yes       |
            | commits | []                   | Array      | Yes       |
            | blobs   | []                   | Array      | Yes       |
            ConceptDetails:
            """
            Git Repository Structure:
            - Objects Database: Stores all content
            - References (refs): Point to commits
            - HEAD: Current position

            Current Operation:
            → Setting up empty repository
            → Preparing storage structures
            """

            Step: 2. Create Blobs
            """
            # @Section: Content Storage
            # @CodeBlock: Define Changes
            changes = [
            {"path": "README.md", "content": "# Project"},
            {"path": "main.py", "content": "print('hello')"}
            ]

            # @CodeBlock: Blob Creation Loop
            for file in changes:
            # @CodeBlock: Hash Calculation
            content_hash = calculate_hash(file["content"])

            # @CodeBlock: Blob Storage
            blob = {
            "type": "blob",
            "content": file["content"],
            "hash": content_hash
            }
            blobs.append(blob)
            repo["objects"][content_hash] = blob
            """
            Variables:
            | Name         | Previous | Current         | Changed | Why Important |
            | content_hash | null     | "8c7e5a..."     | Yes     | Content ID    |
            | blob         | null     | {type: "blob"}  | Yes     | Storage Unit  |
            | objects      | {}       | {8c7e5a: {...}} | Yes     | Object DB     |
            ConceptDetails:
            """
            Blob Creation Process:
            - Content addressing using SHA-1
            - Immutable storage
            - Content deduplication

            Current Focus:
            → How Git identifies unique content
            → Content-addressable storage system
            """

            Step: 3. Build Tree
            """
            # @Section: Directory Structure
            # @CodeBlock: Tree Creation
            tree = {
            "type": "tree",
            "entries": [],
            "hash": None
            }

            # @CodeBlock: Add Entries
            for idx, file in enumerate(changes):
            tree["entries"].append({
            "mode": "100644",
            "path": file["path"],
            "hash": blobs[idx]["hash"]
            })

            # @CodeBlock: Finalize Tree
            tree["hash"] = calculate_hash(str(tree["entries"]))
            trees.append(tree)
            repo["objects"][tree["hash"]] = tree
            """
            Variables:
            | Name         | Previous | Current       | Changed | Why Important   |
            | tree         | null     | {type:"tree"} | Yes     | Directory State |
            | tree.entries | []       | [{mode,path}] | Yes     | File References |
            | tree.hash    | null     | "7de3fa..."   | Yes     | Tree Identity   |
            ConceptDetails:
            """
            Tree Structure:
            - Represents directory state
            - Links to blobs (files)
            - Modes indicate type/permissions

            Current Focus:
            → Building directory structure
            → Linking files to directories
            """

            Step: 4. Create Commit
            """
            # @Section: Commit Creation
            # @CodeBlock: Initialize Commit
            commit = {
            "type": "commit",
            "tree": tree["hash"],
            "parent": repo["latest_commit"],
            "author": "Dev <dev@example.com>",
            "message": "Initial commit",
            "hash": None
            }

            # @CodeBlock: Finalize Commit
            commit["hash"] = calculate_hash(str(commit))
            commits.append(commit)
            repo["objects"][commit["hash"]] = commit

            # @CodeBlock: Update References
            repo["latest_commit"] = commit["hash"]
            repo["refs"]["main"] = commit["hash"]
            repo["refs"]["HEAD"] = "ref: refs/heads/main"
            """
            Variables:
            | Name        | Previous | Current         | Changed | Why Important   |
            | commit      | null     | {type:"commit"} | Yes     | History Record  |
            | commit.tree | null     | "7de3fa..."     | Yes     | Content Link    |
            | refs.main   | null     | "abc123..."     | Yes     | Branch Position |
            ConceptDetails:
            """
            Commit Structure:
            - Points to tree (content state)
            - Links to parent (history)
            - Contains metadata

            Current Focus:
            → Creating history record
            → Updating repository state
            → Linking references
            """

    #
    # Scenario 2: Git Merge Operation
    #
    @AdvancedScenario
    Scenario: Git Merge Process
            Description: "How Git merges changes between branches"
            Prerequisites: "Understanding of Object Storage and Commits"

            @DebugSteps
            Flow:
            | Step | Operation            | Focus Point         |
            | 1    | Load Branch States   | Current vs Target   |
            | 2    | Find Common Ancestor | Merge Base          |
            | 3    | Compare Changes      | Diff Analysis       |
            | 4    | Merge Trees          | Content Combination |
            | 5    | Create Merge Commit  | History Integration |
