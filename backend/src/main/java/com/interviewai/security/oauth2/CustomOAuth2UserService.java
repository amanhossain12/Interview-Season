package com.interviewai.security.oauth2;

import com.interviewai.domain.user.entity.Role;
import com.interviewai.domain.user.entity.User;
import com.interviewai.domain.user.repository.RoleRepository;
import com.interviewai.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        return processOAuth2User(userRequest, oAuth2User);
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest request, OAuth2User oAuth2User) {
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = (String) attributes.get("email");
        String googleId = (String) attributes.get("sub");
        String firstName = (String) attributes.get("given_name");
        String lastName = (String) attributes.get("family_name");
        String avatarUrl = (String) attributes.get("picture");

        User user = userRepository.findByEmailAndDeletedAtIsNull(email)
            .map(existing -> updateExistingUser(existing, googleId, firstName, lastName, avatarUrl))
            .orElseGet(() -> createNewUser(email, googleId, firstName, lastName, avatarUrl));

        return new OAuth2UserPrincipal(user, attributes);
    }

    private User updateExistingUser(User user, String googleId, String firstName, String lastName, String avatarUrl) {
        user.setGoogleId(googleId);
        if (user.getFirstName() == null) user.setFirstName(firstName);
        if (user.getLastName() == null) user.setLastName(lastName);
        if (user.getAvatarUrl() == null) user.setAvatarUrl(avatarUrl);
        user.setEmailVerified(true);
        return userRepository.save(user);
    }

    private User createNewUser(String email, String googleId, String firstName, String lastName, String avatarUrl) {
        Role candidateRole = roleRepository.findByName("ROLE_CANDIDATE")
            .orElseThrow(() -> new RuntimeException("Default role not found"));

        User user = User.builder()
            .email(email)
            .googleId(googleId)
            .firstName(firstName)
            .lastName(lastName)
            .avatarUrl(avatarUrl)
            .role(candidateRole)
            .emailVerified(true)
            .active(true)
            .build();

        return userRepository.save(user);
    }
}
