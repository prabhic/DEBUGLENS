Feature: [Feature Name]
    Description: [Brief description of the feature]
    Source: [Source information]

    @ScenarioCategories
    Navigation:
    | Category    | Scenarios                         | Complexity |
    | [Category1] | [Scenario1], [Scenario2], ...     | [Level]    |
    | [Category2] | [Scenario3], [Scenario4], ...     | [Level]    |

    @DebugFlows
    Available Flows:
    | Flow Name          | Complexity | Time    | Prerequisites     |
    | [Flow1]            | [Level]    | [Time]  | [Requirement1]    |
    | [Flow2]            | [Level]    | [Time]  | [Requirement2]    |

    @DebuggerMetadata
    SessionInfo:
    | Property      | Value                 |
    | Version       | [Tool Version]        |
    | Focus         | [Area of Focus]       |
    | Goal          | [Debugging Objective] |

    # Scenario: [Scenario Name]
    @ScenarioTag
    Scenario: [Scenario Title]
        Description: "[Brief description of the scenario]"

        @DebugSteps
        Flow:
        | Step | Operation                  | Focus Point         |
        | [#]  | [Action]                   | [Focus Area]        |
        | [#]  | [Action]                   | [Focus Area]        |

        Step: [Step Number]. [Step Description]
        """
        # @Region: [Region Name]
        # @Break: [Breakdown Point]
        [Code snippet or setup]

        Variables:
        | Name          | Previous       | Current             | Changed | Why Important |
        | [Variable1]   | [OldValue1]    | [NewValue1]         | [Yes/No] | [Explanation] |
        | [Variable2]   | [OldValue2]    | [NewValue2]         | [Yes/No] | [Explanation] |

        Concepts:
        """
        [Conceptual explanation or insights]

        Current Focus:
        → [Key points for this step]
        """

    # Repeat for each additional scenario or step as required
