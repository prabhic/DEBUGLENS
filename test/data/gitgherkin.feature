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

            @StepBreakdown
            Step: 1. Initialize Repository Structure
            EntryPoint: "Initialize empty repository"
            """
            # @Region: Repository Setup
            # @Break: Initial Structure
            repo = {
            "latest_commit": None,
            "refs": {"HEAD": None, "main": None},
            "objects": {}
            }

            # @Break: Collections Init
            commits = []
            blobs = []
            trees = []
            """
            Variables:
            | Name    | Value                | Type       | Important |
            | repo    | {latest_commit:None} | Dictionary | Yes       |
            | commits | []                   | Array      | Yes       |
            | blobs   | []                   | Array      | Yes       |
            Concepts:
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
            # @Region: Content Storage
            # @Break: Define Changes
            changes = [
            {"path": "README.md", "content": "# Project"},
            {"path": "main.py", "content": "print('hello')"}
            ]

            # @Break: Blob Creation Loop
            for file in changes:
            # @Break: Hash Calculation
            content_hash = calculate_hash(file["content"])

            # @Break: Blob Storage
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
            Concepts:
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
            # @Region: Directory Structure
            # @Break: Tree Creation
            tree = {
            "type": "tree",
            "entries": [],
            "hash": None
            }

            # @Break: Add Entries
            for idx, file in enumerate(changes):
            tree["entries"].append({
            "mode": "100644",
            "path": file["path"],
            "hash": blobs[idx]["hash"]
            })

            # @Break: Finalize Tree
            tree["hash"] = calculate_hash(str(tree["entries"]))
            trees.append(tree)
            repo["objects"][tree["hash"]] = tree
            """
            Variables:
            | Name         | Previous | Current       | Changed | Why Important   |
            | tree         | null     | {type:"tree"} | Yes     | Directory State |
            | tree.entries | []       | [{mode,path}] | Yes     | File References |
            | tree.hash    | null     | "7de3fa..."   | Yes     | Tree Identity   |
            Concepts:
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
            # @Region: Commit Creation
            # @Break: Initialize Commit
            commit = {
            "type": "commit",
            "tree": tree["hash"],
            "parent": repo["latest_commit"],
            "author": "Dev <dev@example.com>",
            "message": "Initial commit",
            "hash": None
            }

            # @Break: Finalize Commit
            commit["hash"] = calculate_hash(str(commit))
            commits.append(commit)
            repo["objects"][commit["hash"]] = commit

            # @Break: Update References
            repo["latest_commit"] = commit["hash"]
            repo["refs"]["main"] = commit["hash"]
            repo["refs"]["HEAD"] = "ref: refs/heads/main"
            """
            Variables:
            | Name        | Previous | Current         | Changed | Why Important   |
            | commit      | null     | {type:"commit"} | Yes     | History Record  |
            | commit.tree | null     | "7de3fa..."     | Yes     | Content Link    |
            | refs.main   | null     | "abc123..."     | Yes     | Branch Position |
            Concepts:
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
    # Scenario 2: Git Merge Process
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

            @StepOutline
            Step: 1. Load Branch States
            EntryPoint: "Load branch states for current and target branches"
            """
            # @Section: Branch State Loading
            # @CodeBlock: Current Branch State
            current_branch = {
            "name": "main",
            "head": "abc123",
            "commit": repo["objects"]["abc123"]
            }

            # @CodeBlock: Target Branch State
            target_branch = {
            "name": "feature",
            "head": "def456",
            "commit": repo["objects"]["def456"]
            }

            # @CodeBlock: Load Trees
            current_tree = repo["objects"][current_branch["commit"]["tree"]]
            target_tree = repo["objects"][target_branch["commit"]["tree"]]
            """
            Variables:
            | Name           | Value                             | Type   | Why Important    |
            | current_branch | {name: "main", head: "abc123"}    | Branch | Base for merge   |
            | target_branch  | {name: "feature", head: "def456"} | Branch | Changes to merge |
            | current_tree   | {type: "tree"}                    | Tree   | Current content  |
            ConceptDetails:
            """
            Branch States:
            - Each branch points to a commit
            - Commits point to content trees
            - Trees represent directory state

            Current Focus:
            → Loading both branch states
            → Preparing for comparison
            """

            Step: 2. Find Common Ancestor
            """
            # @Section: Ancestor Analysis
            # @CodeBlock: Initialize Search
            commit_queue = [current_branch["commit"], target_branch["commit"]]
            visited = set()

            # @CodeBlock: Search Loop
            while commit_queue:
            commit = commit_queue.pop(0)
            if commit["hash"] in visited:
            # @CodeBlock: Found Common Ancestor
            merge_base = commit
            break

            visited.add(commit["hash"])
            if commit["parent"]:
            commit_queue.append(repo["objects"][commit["parent"]])
            """
            Variables:
            | Name         | Previous | Current       | Changed | Why Important     |
            | commit_queue | [2]      | [1]           | Yes     | Search Progress   |
            | merge_base   | null     | {hash: "xyz"} | Yes     | Merge Start Point |
            ConceptDetails:
            """
            Merge Base Discovery:
            - Identifies the latest common commit
            - Serves as the reference point for changes
            - Establishes the base for three-way merge

            Current Focus:
            → Finding the point where branches diverged
            → Establishing a common history reference
            """

            Step: 3. Compare Changes
            """
            # @Section: Change Detection
            # @CodeBlock: Initialize Comparison
            changes = {
            "added": set(),
            "modified": set(),
            "deleted": set(),
            "conflicts": set()
            }

            # @CodeBlock: Compare Trees
            def compare_trees(base, current, target):
            all_paths = set(base.keys()) | set(current.keys()) | set(target.keys())

            for path in all_paths:
            base_hash = base.get(path, {}).get("hash")
            current_hash = current.get(path, {}).get("hash")
            target_hash = target.get(path, {}).get("hash")

            # @CodeBlock: Change Analysis
            if base_hash == current_hash == target_hash:
            continue
            elif base_hash == current_hash:
            changes["added"].add(path)
            elif base_hash == target_hash:
            continue
            else:
            changes["conflicts"].add(path)

            # @CodeBlock: Execute Comparison
            compare_trees(
            get_tree_entries(merge_base["tree"]),
            get_tree_entries(current_tree["hash"]),
            get_tree_entries(target_tree["hash"])
            )
            """
            Variables:
            | Name              | Previous | Current       | Changed | Important       |
            | changes.added     | set()    | {"file1"}     | Yes     | New Files       |
            | changes.conflicts | set()    | {"README.md"} | Yes     | Need Resolution |
            ConceptDetails:
            """
            Three-Way Comparison:
            - Compares base with both branches
            - Detects types of changes
            - Identifies conflicts

            Change Categories:
            → Added: New in target
            → Modified: Changed in one branch
            → Conflicts: Changed in both
            """

            Step: 4. Merge Trees
            """
            # @Section: Tree Merging
            # @CodeBlock: Initialize Merged Tree
            merged_tree = {
            "type": "tree",
            "entries": [],
            "hash": None
            }

            # @CodeBlock: Process Changes
            for path in all_paths:
            if path in changes["conflicts"]:
            # @CodeBlock: Handle Conflict
            content = generate_conflict_markers(
            current_tree[path],
            target_tree[path]
            )
            store_blob_and_add_entry(merged_tree, path, content)
            else:
            # @CodeBlock: Take Appropriate Version
            content = get_content_for_path(path, current_tree, target_tree)
            store_blob_and_add_entry(merged_tree, path, content)

            # @CodeBlock: Finalize Tree
            merged_tree["hash"] = calculate_hash(str(merged_tree["entries"]))
            repo["objects"][merged_tree["hash"]] = merged_tree
            """
            Variables:
            | Name        | Previous | Current       | Changed | Why Important   |
            | merged_tree | null     | {type:"tree"} | Yes     | Combined State  |
            | conflicts   | 0        | 2             | Yes     | Need Resolution |
            ConceptDetails:
            """
            Tree Merging Process:
            - Combines changes from both branches
            - Handles conflicts with markers
            - Creates a new tree object

            Current Focus:
            → Building merged content state
            → Resolving conflicting changes
            """

            Step: 5. Create Merge Commit
            """
            # @Section: Merge Commit Creation
            # @CodeBlock: Build Commit
            merge_commit = {
            "type": "commit",
            "tree": merged_tree["hash"],
            "parents": [
            current_branch["head"],
            target_branch["head"]
            ],
            "author": "Dev <dev@example.com>",
            "message": f"Merge {target_branch['name']} into {current_branch['name']}",
            "hash": None
            }

            # @CodeBlock: Finalize Commit
            merge_commit["hash"] = calculate_hash(str(merge_commit))
            repo["objects"][merge_commit["hash"]] = merge_commit

            # @CodeBlock: Update References
            repo["refs"][current_branch["name"]] = merge_commit["hash"]
            repo["refs"]["HEAD"] = f"ref: refs/heads/{current_branch['name']}"
            """
            Variables:
            | Name         | Previous | Current         | Changed | Why Important |
            | merge_commit | null     | {type:"commit"} | Yes     | Merge Record  |
            | parents      | null     | [hash1, hash2]  | Yes     | History Links |
            | refs.main    | abc123   | def789          | Yes     | Branch Update |
            ConceptDetails:
            """
            Merge Commit Special Features:
            - Contains multiple parent commits
            - Reflects the combined tree state
            - Updates branch reference

            Current Focus:
            → Recording the merge in history
            → Linking multiple parents
            → Updating the repository's state
            """