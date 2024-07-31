/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
    "/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Read Root */
        get: operations["read_root__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get User Info Endpoint */
        get: operations["get_user_info_endpoint_users_me_get"];
        put?: never;
        post?: never;
        /** Delete User Endpoint */
        delete: operations["delete_user_endpoint_users_me_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Logout User Endpoint */
        delete: operations["logout_user_endpoint_users_logout_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Users Batch Endpoint */
        get: operations["get_users_batch_endpoint_users_batch_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get User Info By Id Endpoint */
        get: operations["get_user_info_by_id_endpoint_users__id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/github/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Github Login
         * @description Gives the user a redirect url to login with github.
         *
         *     Returns:
         *         Github oauth redirect url.
         */
        get: operations["github_login_users_github_login_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/github/code": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Github Code
         * @description Gives the user a session token upon successful github authentication and creation of user.
         *
         *     Args:
         *         data: The request body, containing the code from the OAuth redirect.
         *         crud: The CRUD object.
         *         response: The response object.
         *
         *     Returns:
         *         UserInfoResponse.
         */
        post: operations["github_code_users_github_code_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/listings/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Listings */
        get: operations["list_listings_listings_search_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/listings/batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Batch */
        get: operations["get_batch_listings_batch_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/listings/dump": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Dump Listings */
        get: operations["dump_listings_listings_dump_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/listings/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List My Listings */
        get: operations["list_my_listings_listings_me_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/listings/add": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add Listing */
        post: operations["add_listing_listings_add_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/listings/delete/{listing_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete Listing */
        delete: operations["delete_listing_listings_delete__listing_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/listings/edit/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Edit Listing */
        post: operations["edit_listing_listings_edit__id__post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/listings/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Listing */
        get: operations["get_listing_listings__id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/artifacts/url/{artifact_type}/{artifact_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Artifact Url */
        get: operations["artifact_url_artifacts_url__artifact_type___artifact_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/artifacts/{listing_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Artifacts */
        get: operations["list_artifacts_artifacts__listing_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/artifacts/upload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload */
        post: operations["upload_artifacts_upload_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/artifacts/delete/{artifact_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete */
        delete: operations["delete_artifacts_delete__artifact_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** Body_upload_artifacts_upload_post */
        Body_upload_artifacts_upload_post: {
            /**
             * File
             * Format: binary
             */
            file: string;
            /** Metadata */
            metadata: string;
        };
        /** DumpListingsResponse */
        DumpListingsResponse: {
            /** Listings */
            listings: components["schemas"]["Listing"][];
        };
        /** GetListingResponse */
        GetListingResponse: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /** Description */
            description: string | null;
            /** Child Ids */
            child_ids: string[];
            /** Owner Is User */
            owner_is_user: boolean;
        };
        /** GithubAuthRequest */
        GithubAuthRequest: {
            /** Code */
            code: string;
        };
        /** GithubAuthResponse */
        GithubAuthResponse: {
            /** Api Key */
            api_key: string;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** ListArtifactsItem */
        ListArtifactsItem: {
            /** Artifact Id */
            artifact_id: string;
            /**
             * Artifact Type
             * @enum {string}
             */
            artifact_type: "image" | "urdf" | "mjcf";
            /** Description */
            description: string | null;
            /** Timestamp */
            timestamp: number;
            /** Url */
            url: string;
        };
        /** ListArtifactsResponse */
        ListArtifactsResponse: {
            /** Artifacts */
            artifacts: components["schemas"]["ListArtifactsItem"][];
        };
        /** ListListingsResponse */
        ListListingsResponse: {
            /** Listings */
            listings: components["schemas"]["Listing"][];
            /**
             * Has Next
             * @default false
             */
            has_next: boolean;
        };
        /**
         * Listing
         * @description Defines a recursively-defined listing.
         *
         *     Listings can have sub-listings with their component parts. They can also
         *     have associated user-uploaded artifacts like images and URDFs.
         */
        Listing: {
            /** Id */
            id: string;
            /** User Id */
            user_id: string;
            /** Name */
            name: string;
            /** Child Ids */
            child_ids: string[];
            /** Description */
            description: string | null;
        };
        /** NewListingRequest */
        NewListingRequest: {
            /** Name */
            name: string;
            /** Child Ids */
            child_ids: string[];
            /** Description */
            description: string | null;
        };
        /** NewListingResponse */
        NewListingResponse: {
            /** Listing Id */
            listing_id: string;
        };
        /** PublicUserInfoResponse */
        PublicUserInfoResponse: {
            /** Users */
            users: components["schemas"]["SinglePublicUserInfoResponseItem"][];
        };
        /** SinglePublicUserInfoResponseItem */
        SinglePublicUserInfoResponseItem: {
            /** Id */
            id: string;
            /** Email */
            email: string;
        };
        /** UpdateListingRequest */
        UpdateListingRequest: {
            /** Name */
            name?: string | null;
            /** Child Ids */
            child_ids?: string[] | null;
            /** Description */
            description?: string | null;
        };
        /** UpdateListingResponse */
        UpdateListingResponse: {
            /** Listing Id */
            listing_id: string;
        };
        /** UploadArtifactResponse */
        UploadArtifactResponse: {
            /** Artifact Id */
            artifact_id: string;
        };
        /** UserInfoResponse */
        UserInfoResponse: {
            /** User Id */
            user_id: string;
            /** Permissions */
            permissions: "is_admin"[] | null;
        };
        /** ValidationError */
        ValidationError: {
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    read_root__get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
        };
    };
    get_user_info_endpoint_users_me_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserInfoResponse"];
                };
            };
        };
    };
    delete_user_endpoint_users_me_delete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
        };
    };
    logout_user_endpoint_users_logout_delete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
        };
    };
    get_users_batch_endpoint_users_batch_get: {
        parameters: {
            query: {
                ids: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicUserInfoResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_user_info_by_id_endpoint_users__id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SinglePublicUserInfoResponseItem"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    github_login_users_github_login_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": string;
                };
            };
        };
    };
    github_code_users_github_code_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GithubAuthRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GithubAuthResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_listings_listings_search_get: {
        parameters: {
            query: {
                /** @description Page number for pagination */
                page: number;
                /** @description Search query string */
                search_query?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListListingsResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_batch_listings_batch_get: {
        parameters: {
            query: {
                /** @description List of part ids */
                ids: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListListingsResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    dump_listings_listings_dump_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DumpListingsResponse"];
                };
            };
        };
    };
    list_my_listings_listings_me_get: {
        parameters: {
            query: {
                /** @description Page number for pagination */
                page: number;
                /** @description Search query string */
                search_query?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListListingsResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    add_listing_listings_add_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["NewListingRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NewListingResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_listing_listings_delete__listing_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    edit_listing_listings_edit__id__post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateListingRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UpdateListingResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_listing_listings__id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GetListingResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    artifact_url_artifacts_url__artifact_type___artifact_id__get: {
        parameters: {
            query?: {
                size?: "small" | "large";
            };
            header?: never;
            path: {
                artifact_type: "image" | "urdf" | "mjcf";
                artifact_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_artifacts_artifacts__listing_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListArtifactsResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    upload_artifacts_upload_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_upload_artifacts_upload_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UploadArtifactResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_artifacts_delete__artifact_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                artifact_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
}
